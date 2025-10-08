import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ToolRegistry, Tool, ToolExecutionContext, ToolOutput } from './tool-registry.js';
import { WorkflowEngine, Workflow, WorkflowExecutionContext } from './workflow-engine.js';
import { AgentCommunicationProtocol, AgentMessage, Task } from './agent-communication.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';

// Testing schemas
const MockToolSchema = z.object({
  name: z.string(),
  provider: z.string(),
  responses: z.array(z.object({
    input: z.record(z.any()),
    output: z.record(z.any()),
    delay: z.number().default(0),
    error: z.string().optional(),
  })).default([]),
  defaultResponse: z.record(z.any()).optional(),
  defaultError: z.string().optional(),
  defaultDelay: z.number().default(0),
});

const MockAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilities: z.array(z.string()).default([]),
  responses: z.array(z.object({
    messageType: z.string(),
    response: z.record(z.any()).optional(),
    delay: z.number().default(0),
    error: z.string().optional(),
  })).default([]),
  defaultResponse: z.record(z.any()).optional(),
  defaultError: z.string().optional(),
  defaultDelay: z.number().default(0),
});

const TestScenarioSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  setup: z.array(z.string()).default([]),
  steps: z.array(z.object({
    action: z.string(),
    input: z.record(z.any()).optional(),
    expectedOutput: z.record(z.any()).optional(),
    expectedError: z.string().optional(),
    timeout: z.number().default(30000),
  })),
  teardown: z.array(z.string()).default([]),
});

const TestResultSchema = z.object({
  scenarioName: z.string(),
  passed: z.boolean(),
  duration: z.number(),
  steps: z.array(z.object({
    step: z.number(),
    action: z.string(),
    passed: z.boolean(),
    duration: z.number(),
    output: z.record(z.any()).optional(),
    error: z.string().optional(),
  })),
  errors: z.array(z.string()).default([]),
  timestamp: z.date(),
});

export type MockTool = z.infer<typeof MockToolSchema>;
export type MockAgent = z.infer<typeof MockAgentSchema>;
export type TestScenario = z.infer<typeof TestScenarioSchema>;
export type TestResult = z.infer<typeof TestResultSchema>;

export interface TestContext {
  workflowEngine: WorkflowEngine;
  toolRegistry: ToolRegistry;
  agentCommunication: AgentCommunicationProtocol;
  configManager: ConfigManager;
  securityManager: SecurityManager;
  mocks: {
    tools: Map<string, MockTool>;
    agents: Map<string, MockAgent>;
  };
}

export class TestingFramework extends EventEmitter {
  private testContext: TestContext;
  private logger: ReturnType<typeof createLogger>;
  private mockTools: Map<string, MockTool> = new Map();
  private mockAgents: Map<string, MockAgent> = new Map();
  private testResults: TestResult[] = [];

  constructor(
    testContext: TestContext,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.testContext = testContext;
    this.logger = logger;
  }

  /**
   * Create a mock tool
   */
  createMockTool(mockTool: MockTool): void {
    const validatedMock = MockToolSchema.parse(mockTool);
    this.mockTools.set(`${validatedMock.name}:${validatedMock.provider}`, validatedMock);

    // Create actual mock tool implementation
    const tool: Tool = {
      metadata: {
        name: validatedMock.name,
        description: `Mock tool for ${validatedMock.name}`,
        version: '1.0.0',
        provider: validatedMock.provider,
        category: 'utility',
        tags: ['mock', 'test'],
        timeout: 30000,
        retryable: true,
        requiresAuth: false,
        scopes: [],
      },
      capabilities: [{
        name: validatedMock.name,
        description: `Mock capability for ${validatedMock.name}`,
        inputTypes: ['any'],
        outputTypes: ['any'],
        supportedProviders: [validatedMock.provider],
      }],
      execute: async (input: any, context: ToolExecutionContext): Promise<ToolOutput> => {
        return this.executeMockTool(validatedMock, input, context);
      },
      healthCheck: async (): Promise<boolean> => {
        return true;
      },
      validate: (input: any): { valid: boolean; errors: string[] } => {
        return { valid: true, errors: [] };
      },
    };

    // Register with tool registry
    this.testContext.toolRegistry.registerTool(
      validatedMock.name,
      validatedMock.provider,
      tool
    );

    this.logger.info({
      tool: validatedMock.name,
      provider: validatedMock.provider,
    }, 'Mock tool created');
  }

  /**
   * Create a mock agent
   */
  createMockAgent(mockAgent: MockAgent): void {
    const validatedMock = MockAgentSchema.parse(mockAgent);
    this.mockAgents.set(validatedMock.id, validatedMock);

    // Register with communication protocol
    this.testContext.agentCommunication.registerAgent(
      validatedMock.id,
      validatedMock.name,
      validatedMock.capabilities.map(cap => ({
        name: cap,
        description: `Mock capability: ${cap}`,
        inputSchema: {},
        outputSchema: {},
        capabilities: [],
      })),
      { mock: true }
    );

    // Set up message handler
    this.testContext.agentCommunication.registerMessageHandler(
      `mock_${validatedMock.id}`,
      async (message: AgentMessage, context) => {
        return this.handleMockAgentMessage(validatedMock, message, context);
      }
    );

    this.logger.info({
      agentId: validatedMock.id,
      name: validatedMock.name,
      capabilities: validatedMock.capabilities.length,
    }, 'Mock agent created');
  }

  /**
   * Execute a test scenario
   */
  async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const testResult: TestResult = {
      scenarioName: scenario.name,
      passed: true,
      duration: 0,
      steps: [],
      errors: [],
      timestamp: new Date(),
    };

    this.logger.info({ scenario: scenario.name }, 'Starting test scenario');

    try {
      // Setup
      await this.executeSetupSteps(scenario.setup);

      // Execute test steps
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepStartTime = Date.now();

        try {
          const stepResult = await this.executeTestStep(step, i + 1);
          testResult.steps.push({
            step: i + 1,
            action: step.action,
            passed: stepResult.passed,
            duration: Date.now() - stepStartTime,
            output: stepResult.output,
            error: stepResult.error,
          });

          if (!stepResult.passed) {
            testResult.passed = false;
            testResult.errors.push(`Step ${i + 1}: ${stepResult.error}`);
          }

        } catch (error) {
          testResult.steps.push({
            step: i + 1,
            action: step.action,
            passed: false,
            duration: Date.now() - stepStartTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          testResult.passed = false;
          testResult.errors.push(`Step ${i + 1}: ${error}`);
        }
      }

      // Teardown
      await this.executeTeardownSteps(scenario.teardown);

    } catch (error) {
      testResult.passed = false;
      testResult.errors.push(`Scenario setup/teardown failed: ${error}`);
    }

    testResult.duration = Date.now() - startTime;
    this.testResults.push(testResult);

    this.logger.info({
      scenario: scenario.name,
      passed: testResult.passed,
      duration: testResult.duration,
      stepsPassed: testResult.steps.filter(s => s.passed).length,
      totalSteps: testResult.steps.length,
    }, 'Test scenario completed');

    this.emit('test:completed', { scenario: scenario.name, result: testResult });
    return testResult;
  }

  /**
   * Execute setup steps
   */
  private async executeSetupSteps(setupSteps: string[]): Promise<void> {
    for (const step of setupSteps) {
      await this.executeSetupStep(step);
    }
  }

  /**
   * Execute a single setup step
   */
  private async executeSetupStep(step: string): Promise<void> {
    // Parse step command
    const [command, ...args] = step.split(' ');

    switch (command) {
      case 'create_mock_tool':
        const toolName = args[0];
        const provider = args[1];
        this.createMockTool({
          name: toolName,
          provider,
          responses: [],
          defaultResponse: { success: true },
        });
        break;

      case 'create_mock_agent':
        const agentId = args[0];
        const agentName = args[1];
        this.createMockAgent({
          id: agentId,
          name: agentName,
          capabilities: [],
          responses: [],
          defaultResponse: { success: true },
        });
        break;

      case 'set_config':
        const section = args[0];
        const key = args[1];
        const value = args[2];
        this.testContext.configManager.setConfigValue(section, key, value);
        break;

      case 'set_feature_flag':
        const flagName = args[0];
        const enabled = args[1] === 'true';
        this.testContext.configManager.setFeatureFlag(flagName, enabled);
        break;

      default:
        this.logger.warn({ step }, 'Unknown setup command');
    }
  }

  /**
   * Execute a test step
   */
  private async executeTestStep(
    step: TestScenario['steps'][0],
    stepNumber: number
  ): Promise<{ passed: boolean; output?: any; error?: string }> {
    const timeout = setTimeout(() => {
      throw new Error(`Step ${stepNumber} timed out after ${step.timeout}ms`);
    }, step.timeout);

    try {
      let output: any;

      switch (step.action) {
        case 'execute_workflow':
          output = await this.testContext.workflowEngine.executeWorkflow(
            step.input?.workflowName || '',
            step.input?.payload || {},
            step.input?.context || {}
          );
          break;

        case 'execute_tool':
          output = await this.testContext.toolRegistry.executeTool(
            step.input?.toolName || '',
            step.input?.providerName || '',
            step.input?.input || {},
            step.input?.context || {}
          );
          break;

        case 'send_message':
          await this.testContext.agentCommunication.sendMessage(
            step.input?.from || '',
            step.input?.to || '',
            step.input?.subject || '',
            step.input?.payload || {}
          );
          output = { success: true };
          break;

        case 'create_task':
          const taskId = await this.testContext.agentCommunication.createTask(
            step.input?.type || '',
            step.input?.description || '',
            step.input?.input || {}
          );
          output = { taskId };
          break;

        case 'check_feature_flag':
          const flagValue = this.testContext.configManager.getFeatureFlag(
            step.input?.name || '',
            step.input?.context || {}
          );
          output = { enabled: flagValue };
          break;

        case 'check_config':
          const configValue = this.testContext.configManager.getConfigValue(
            step.input?.section || '',
            step.input?.key || '',
            step.input?.defaultValue
          );
          output = { value: configValue };
          break;

        default:
          throw new Error(`Unknown test action: ${step.action}`);
      }

      clearTimeout(timeout);

      // Validate expected output
      if (step.expectedOutput) {
        const isValid = this.validateOutput(output, step.expectedOutput);
        if (!isValid) {
          return {
            passed: false,
            output,
            error: 'Output does not match expected result',
          };
        }
      }

      return { passed: true, output };

    } catch (error) {
      clearTimeout(timeout);

      if (step.expectedError) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes(step.expectedError)) {
          return { passed: true, error: errorMessage };
        }
      }

      return {
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute teardown steps
   */
  private async executeTeardownSteps(teardownSteps: string[]): Promise<void> {
    for (const step of teardownSteps) {
      await this.executeTeardownStep(step);
    }
  }

  /**
   * Execute a single teardown step
   */
  private async executeTeardownStep(step: string): Promise<void> {
    const [command, ...args] = step.split(' ');

    switch (command) {
      case 'remove_mock_tool':
        const toolName = args[0];
        const provider = args[1];
        this.mockTools.delete(`${toolName}:${provider}`);
        break;

      case 'remove_mock_agent':
        const agentId = args[0];
        this.mockAgents.delete(agentId);
        break;

      case 'clear_config':
        const section = args[0];
        const key = args[1];
        this.testContext.configManager.setConfigValue(section, key, undefined);
        break;

      default:
        this.logger.warn({ step }, 'Unknown teardown command');
    }
  }

  /**
   * Execute mock tool
   */
  private async executeMockTool(
    mockTool: MockTool,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolOutput> {
    // Find matching response
    const matchingResponse = mockTool.responses.find(response => 
      JSON.stringify(response.input) === JSON.stringify(input)
    );

    if (matchingResponse) {
      if (matchingResponse.error) {
        throw new Error(matchingResponse.error);
      }

      if (matchingResponse.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, matchingResponse.delay));
      }

      return matchingResponse.output;
    }

    // Use default response
    if (mockTool.defaultError) {
      throw new Error(mockTool.defaultError);
    }

    if (mockTool.defaultDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, mockTool.defaultDelay));
    }

    return mockTool.defaultResponse || { success: true };
  }

  /**
   * Handle mock agent message
   */
  private async handleMockAgentMessage(
    mockAgent: MockAgent,
    message: AgentMessage,
    context: any
  ): Promise<AgentMessage | void> {
    // Find matching response
    const matchingResponse = mockAgent.responses.find(response => 
      response.messageType === message.subject
    );

    if (matchingResponse) {
      if (matchingResponse.error) {
        throw new Error(matchingResponse.error);
      }

      if (matchingResponse.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, matchingResponse.delay));
      }

      return {
        id: `mock_response_${Date.now()}`,
        type: 'response',
        from: mockAgent.id,
        to: message.from,
        subject: 'response',
        payload: matchingResponse.response || { success: true },
        timestamp: new Date(),
        ttl: 300000,
        priority: 'normal',
        correlationId: message.id,
      };
    }

    // Use default response
    if (mockAgent.defaultError) {
      throw new Error(mockAgent.defaultError);
    }

    if (mockAgent.defaultDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, mockAgent.defaultDelay));
    }

    return {
      id: `mock_response_${Date.now()}`,
      type: 'response',
      from: mockAgent.id,
      to: message.from,
      subject: 'response',
      payload: mockAgent.defaultResponse || { success: true },
      timestamp: new Date(),
      ttl: 300000,
      priority: 'normal',
      correlationId: message.id,
    };
  }

  /**
   * Validate output against expected result
   */
  private validateOutput(output: any, expected: any): boolean {
    if (typeof expected === 'object' && expected !== null) {
      for (const [key, value] of Object.entries(expected)) {
        if (!(key in output) || !this.validateOutput(output[key], value)) {
          return false;
        }
      }
      return true;
    }
    return output === expected;
  }

  /**
   * Get test results
   */
  getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Get test statistics
   */
  getTestStatistics(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageDuration: number;
    successRate: number;
  } {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      averageDuration,
      successRate,
    };
  }

  /**
   * Clear all test results
   */
  clearTestResults(): void {
    this.testResults = [];
  }

  /**
   * Clear all mocks
   */
  clearMocks(): void {
    this.mockTools.clear();
    this.mockAgents.clear();
  }

  /**
   * Generate test report
   */
  generateTestReport(): string {
    const stats = this.getTestStatistics();
    const results = this.getTestResults();

    let report = `# Test Report\n\n`;
    report += `## Summary\n`;
    report += `- Total Tests: ${stats.totalTests}\n`;
    report += `- Passed: ${stats.passedTests}\n`;
    report += `- Failed: ${stats.failedTests}\n`;
    report += `- Success Rate: ${stats.successRate.toFixed(2)}%\n`;
    report += `- Average Duration: ${stats.averageDuration.toFixed(2)}ms\n\n`;

    report += `## Test Results\n\n`;
    for (const result of results) {
      report += `### ${result.scenarioName}\n`;
      report += `- Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `- Duration: ${result.duration}ms\n`;
      
      if (result.errors.length > 0) {
        report += `- Errors:\n`;
        for (const error of result.errors) {
          report += `  - ${error}\n`;
        }
      }
      
      report += `\n`;
    }

    return report;
  }

  /**
   * Start the testing framework
   */
  async start(): Promise<void> {
    this.logger.info('Testing framework started');
  }

  /**
   * Stop the testing framework
   */
  async stop(): Promise<void> {
    this.clearMocks();
    this.logger.info('Testing framework stopped');
  }
}