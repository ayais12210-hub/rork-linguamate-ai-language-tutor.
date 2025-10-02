import { offlineQueue } from './offlineQueue';
import { offlineManager } from './index';

export async function syncProgress(userId: string, progressData: unknown) {
  console.log('[Sync] Syncing progress for user:', userId);
  
  if (offlineManager.currentStatus.isOffline) {
    console.log('[Sync] Offline - queueing progress update');
    await offlineQueue.enqueue('UPDATE_PROGRESS', { userId, progressData }, 'high');
    return { queued: true };
  }

  try {
    console.log('[Sync] Online - syncing progress immediately');
    await new Promise(resolve => setTimeout(resolve, 500));
    offlineManager.setLastSync(new Date());
    return { success: true };
  } catch (error) {
    console.error('[Sync] Failed to sync progress:', error);
    await offlineQueue.enqueue('UPDATE_PROGRESS', { userId, progressData }, 'high');
    throw error;
  }
}

export async function syncLesson(userId: string, lessonId: string, completionData: unknown) {
  console.log('[Sync] Syncing lesson completion:', lessonId);
  
  if (offlineManager.currentStatus.isOffline) {
    console.log('[Sync] Offline - queueing lesson completion');
    await offlineQueue.enqueue('COMPLETE_LESSON', { userId, lessonId, completionData }, 'high');
    return { queued: true };
  }

  try {
    console.log('[Sync] Online - syncing lesson immediately');
    await new Promise(resolve => setTimeout(resolve, 500));
    offlineManager.setLastSync(new Date());
    return { success: true };
  } catch (error) {
    console.error('[Sync] Failed to sync lesson:', error);
    await offlineQueue.enqueue('COMPLETE_LESSON', { userId, lessonId, completionData }, 'high');
    throw error;
  }
}

export async function syncVocabulary(userId: string, vocabularyData: unknown) {
  console.log('[Sync] Syncing vocabulary for user:', userId);
  
  if (offlineManager.currentStatus.isOffline) {
    console.log('[Sync] Offline - queueing vocabulary update');
    await offlineQueue.enqueue('UPDATE_VOCABULARY', { userId, vocabularyData }, 'normal');
    return { queued: true };
  }

  try {
    console.log('[Sync] Online - syncing vocabulary immediately');
    await new Promise(resolve => setTimeout(resolve, 500));
    offlineManager.setLastSync(new Date());
    return { success: true };
  } catch (error) {
    console.error('[Sync] Failed to sync vocabulary:', error);
    await offlineQueue.enqueue('UPDATE_VOCABULARY', { userId, vocabularyData }, 'normal');
    throw error;
  }
}

export async function syncChatMessage(userId: string, chatId: string, message: unknown) {
  console.log('[Sync] Syncing chat message:', chatId);
  
  if (offlineManager.currentStatus.isOffline) {
    console.log('[Sync] Offline - queueing chat message');
    await offlineQueue.enqueue('SAVE_CHAT_MESSAGE', { userId, chatId, message }, 'normal');
    return { queued: true };
  }

  try {
    console.log('[Sync] Online - syncing chat message immediately');
    await new Promise(resolve => setTimeout(resolve, 500));
    offlineManager.setLastSync(new Date());
    return { success: true };
  } catch (error) {
    console.error('[Sync] Failed to sync chat message:', error);
    await offlineQueue.enqueue('SAVE_CHAT_MESSAGE', { userId, chatId, message }, 'normal');
    throw error;
  }
}

export async function forceSyncAll() {
  console.log('[Sync] Force syncing all queued actions');
  
  if (offlineManager.currentStatus.isOffline) {
    console.log('[Sync] Cannot force sync while offline');
    return { error: 'offline' };
  }

  try {
    await offlineQueue.flush();
    return { success: true };
  } catch (error) {
    console.error('[Sync] Force sync failed:', error);
    return { error: 'failed' };
  }
}
