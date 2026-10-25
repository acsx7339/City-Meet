import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TonightFilter from '../../src/components/TonightFilter';
import { CATEGORIES } from '../../src/data/mockEvents';

describe('TonightFilter', () => {
  const defaultProps = {
    activeCategory: 'all',
    onSelectCategory: vi.fn(),
    sourceFilter: 'all',
    onSelectSource: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn()
  };

  it('renders search input when onSearchChange is provided', () => {
    render(<TonightFilter {...defaultProps} />);
    const input = screen.getByPlaceholderText(/搜尋氣旋/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not render search input when onSearchChange is not provided', () => {
    const propsWithoutSearch = { ...defaultProps, onSearchChange: undefined };
    render(<TonightFilter {...propsWithoutSearch} />);
    const input = screen.queryByPlaceholderText(/搜尋氣旋/i);
    expect(input).not.toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    render(<TonightFilter {...defaultProps} />);
    const input = screen.getByPlaceholderText(/搜尋氣旋/i);
    fireEvent.change(input, { target: { value: '台北' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('台北');
  });

  it('renders all source filter buttons', () => {
    render(<TonightFilter {...defaultProps} />);
    expect(screen.getByText('全城氣旋')).toBeInTheDocument();
    expect(screen.getByText('官方強颱')).toBeInTheDocument();
    expect(screen.getByText('民間小局')).toBeInTheDocument();
  });

  it('calls onSelectSource when source filter buttons are clicked', () => {
    render(<TonightFilter {...defaultProps} />);
    fireEvent.click(screen.getByText('官方強颱'));
    expect(defaultProps.onSelectSource).toHaveBeenCalledWith('official');

    fireEvent.click(screen.getByText('民間小局'));
    expect(defaultProps.onSelectSource).toHaveBeenCalledWith('ugc');

    fireEvent.click(screen.getByText('全城氣旋'));
    expect(defaultProps.onSelectSource).toHaveBeenCalledWith('all');
  });

  it('highlights the active source filter button', () => {
    const { rerender } = render(<TonightFilter {...defaultProps} sourceFilter="official" />);
    // "官方強颱" should be active, but testing specific inline style changes is brittle.
    // We'll rely on class or style presence if easily identifiable, otherwise rendering is enough
    const officialBtn = screen.getByText('官方強颱').closest('button');
    expect(officialBtn).toHaveStyle({ background: 'rgba(239, 68, 68, 0.2)' });

    rerender(<TonightFilter {...defaultProps} sourceFilter="ugc" />);
    const ugcBtn = screen.getByText('民間小局').closest('button');
    expect(ugcBtn).toHaveStyle({ background: 'rgba(16, 185, 129, 0.2)' });
  });

  it('renders category buttons', () => {
    render(<TonightFilter {...defaultProps} />);
    CATEGORIES.forEach(cat => {
      expect(screen.getByText(cat.name)).toBeInTheDocument();
    });
  });

  it('calls onSelectCategory when category button is clicked', () => {
    render(<TonightFilter {...defaultProps} />);
    if (CATEGORIES.length > 1) {
      fireEvent.click(screen.getByText(CATEGORIES[1].name));
      expect(defaultProps.onSelectCategory).toHaveBeenCalledWith(CATEGORIES[1].id);
    }
  });
});
