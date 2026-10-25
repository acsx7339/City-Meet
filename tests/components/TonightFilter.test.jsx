import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TonightFilter from '../../src/components/TonightFilter';
import { CATEGORIES } from '../../src/data/mockEvents';
import * as geocoding from '../../src/utils/geocoding';

describe('TonightFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(geocoding, 'searchAddress').mockResolvedValue([
      { shortName: '台北車站', displayName: '台北車站, 台灣', lat: 25.0478, lng: 121.5170, name: '台北車站' }
    ]);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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
    const input = screen.getByPlaceholderText(/搜尋/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does not render search input when onSearchChange is not provided', () => {
    const propsWithoutSearch = { ...defaultProps, onSearchChange: undefined };
    render(<TonightFilter {...propsWithoutSearch} />);
    const input = screen.queryByPlaceholderText(/搜尋/i);
    expect(input).not.toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    render(<TonightFilter {...defaultProps} />);
    const input = screen.getByPlaceholderText(/搜尋/i);
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

  it('renders GPS location button and triggers geolocation on click', () => {
    const onSelectLocation = vi.fn();
    const getCurrentPositionMock = vi.fn((success) => {
      success({ coords: { latitude: 25.0421, longitude: 121.5324 } });
    });

    // Mock geolocation
    const origGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      writable: true,
      configurable: true
    });

    render(<TonightFilter {...defaultProps} onSelectLocation={onSelectLocation} />);
    const gpsBtn = screen.getByTitle(/GPS 即時定位/i);
    expect(gpsBtn).toBeInTheDocument();

    fireEvent.click(gpsBtn);
    expect(getCurrentPositionMock).toHaveBeenCalled();
    expect(onSelectLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '我的目前位置 (GPS)',
        lat: 25.0421,
        lng: 121.5324,
        isGps: true
      })
    );

    // Restore geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: origGeolocation,
      writable: true,
      configurable: true
    });
  });
  describe('Geocoding Interactions', () => {
    it('debounces searchAddress and shows dropdown with results', async () => {
      render(<TonightFilter {...defaultProps} searchQuery="台北" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(geocoding.searchAddress).toHaveBeenCalledWith('台北');
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });
    });

    it('clears suggestions if query is too short', async () => {
      render(<TonightFilter {...defaultProps} searchQuery="a" />);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(geocoding.searchAddress).not.toHaveBeenCalled();
    });

    it('selects location and closes dropdown on click', async () => {
      const onSelectLocation = vi.fn();
      const onSearchChange = vi.fn();
      render(<TonightFilter {...defaultProps} searchQuery="台北" onSelectLocation={onSelectLocation} onSearchChange={onSearchChange} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('台北車站'));

      expect(onSearchChange).toHaveBeenCalledWith('台北車站');
      expect(onSelectLocation).toHaveBeenCalledWith(expect.objectContaining({ shortName: '台北車站' }));
      expect(screen.queryByText('地標／地址定位（點擊直飛）：')).not.toBeInTheDocument();
    });

    it('selects top location on Enter key', async () => {
      const onSelectLocation = vi.fn();
      render(<TonightFilter {...defaultProps} searchQuery="台北" onSelectLocation={onSelectLocation} />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onSelectLocation).toHaveBeenCalled();
      expect(screen.queryByText('地標／地址定位（點擊直飛）：')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      render(<TonightFilter {...defaultProps} searchQuery="台北" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(screen.queryByText('地標／地址定位（點擊直飛）：')).not.toBeInTheDocument();
    });

    it('handles geocoding error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      geocoding.searchAddress.mockRejectedValueOnce(new Error('API failed'));

      render(<TonightFilter {...defaultProps} searchQuery="台北" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Geocoding error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('opens dropdown on focus if there are suggestions', async () => {
      render(<TonightFilter {...defaultProps} searchQuery="台北" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });

      // Close it first with Escape
      const input = screen.getByPlaceholderText(/搜尋/i);
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByText('台北車站')).not.toBeInTheDocument();

      // Focus again to open
      fireEvent.focus(input);
      expect(screen.getByText('台北車站')).toBeInTheDocument();
    });

    it('shows clear search button when there is a query, and triggers clear', async () => {
      const onSearchChange = vi.fn();
      const onSelectLocation = vi.fn();
      render(<TonightFilter {...defaultProps} searchQuery="台北" onSearchChange={onSearchChange} onSelectLocation={onSelectLocation} />);

      const clearBtn = screen.getByTitle('清除');
      expect(clearBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(clearBtn);
      });

      expect(onSearchChange).toHaveBeenCalledWith('');
      expect(onSelectLocation).toHaveBeenCalledWith(null);
    });

    it('shows searchedLocation and unselects when input changes', async () => {
      const onSelectLocation = vi.fn();
      const searchedLoc = { name: '台北101' };
      render(<TonightFilter {...defaultProps} searchQuery="台北101" searchedLocation={searchedLoc} onSelectLocation={onSelectLocation} />);

      expect(screen.getByText(/已鎖定：/)).toBeInTheDocument();
      expect(screen.getByText('台北101')).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/搜尋/i);
      await act(async () => {
        fireEvent.change(input, { target: { value: '台北10' } });
      });

      expect(onSelectLocation).toHaveBeenCalledWith(null);
    });

    it('closes dropdown on click outside', async () => {
      render(<TonightFilter {...defaultProps} searchQuery="台北" />);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('台北車站')).toBeInTheDocument();
      });

      // trigger document mousedown
      act(() => {
        fireEvent.mouseDown(document.body);
      });

      expect(screen.queryByText('地標／地址定位（點擊直飛）：')).not.toBeInTheDocument();
    });
  });
});
