import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LanguageSearchBar from '@/components/search/LanguageSearchBar';

describe('LanguageSearchBar', () => {
  test('renders search bar with placeholder', () => {
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="" onChange={onChange} placeholder="Search languages" />
    );
    expect(screen.getByPlaceholderText('Search languages')).toBeTruthy();
  });

  test('displays current value', () => {
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="punjabi" onChange={onChange} />
    );
    expect(screen.getByDisplayValue('punjabi')).toBeTruthy();
  });

  test('calls onChange after debounce delay', async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="" onChange={onChange} />
    );

    const input = screen.getByTestId('language-search');
    fireEvent(input, 'onChangeText', 'pa');

    expect(onChange).not.toHaveBeenCalled();

    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('pa');
    });

    jest.useRealTimers();
  });

  test('shows clear button when text is present', () => {
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="test" onChange={onChange} />
    );
    expect(screen.getByLabelText('Clear search')).toBeTruthy();
  });

  test('hides clear button when text is empty', () => {
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="" onChange={onChange} />
    );
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  test('clears input when clear button is pressed', async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="test" onChange={onChange} />
    );

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent(clearButton, 'onPress');

    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('');
    });

    jest.useRealTimers();
  });

  test('has correct accessibility attributes', () => {
    const onChange = jest.fn();
    render(
      <LanguageSearchBar value="" onChange={onChange} />
    );
    const input = screen.getByLabelText('Search languages');
    expect(input).toBeTruthy();
  });
});
