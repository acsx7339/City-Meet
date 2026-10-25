import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SafetyBadge from '../../src/components/SafetyBadge';

describe('SafetyBadge', () => {
  it('does not render when safetyTrust is not provided', () => {
    const { container } = render(<SafetyBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders official compact badge correctly', () => {
    const safetyTrust = { isOfficial: true, score: 100 };
    render(<SafetyBadge safetyTrust={safetyTrust} compact={true} />);
    expect(screen.getByText('官方認證')).toBeInTheDocument();
  });

  it('renders unofficial compact badge correctly', () => {
    const safetyTrust = { isOfficial: false, score: 85 };
    render(<SafetyBadge safetyTrust={safetyTrust} compact={true} />);
    expect(screen.getByText('信任分 85')).toBeInTheDocument();
  });

  it('renders official normal badge correctly', () => {
    const safetyTrust = { isOfficial: true, score: 100, hostName: 'CityMeet Official', flags: ['安全'] };
    render(<SafetyBadge safetyTrust={safetyTrust} compact={false} />);
    expect(screen.getByText('安全氣象台・官方驗證標章')).toBeInTheDocument();
    expect(screen.getByText('免驗證高信任度')).toBeInTheDocument();
    expect(screen.getByText('主辦：CityMeet Official')).toBeInTheDocument();
    expect(screen.getByText('✓ 安全')).toBeInTheDocument();
  });

  it('renders unofficial normal badge correctly', () => {
    const safetyTrust = { isOfficial: false, score: 92, hostName: 'John Doe', flags: ['友善', '準時'] };
    render(<SafetyBadge safetyTrust={safetyTrust} compact={false} />);
    expect(screen.getByText('主辦人信任度 92 分')).toBeInTheDocument();
    expect(screen.getByText('防濫用評鑑機制')).toBeInTheDocument();
    expect(screen.getByText('主辦：John Doe')).toBeInTheDocument();
    expect(screen.getByText('✓ 友善')).toBeInTheDocument();
    expect(screen.getByText('✓ 準時')).toBeInTheDocument();
  });

  it('renders default hostName if not provided', () => {
    const safetyTrust = { isOfficial: false, score: 80 };
    render(<SafetyBadge safetyTrust={safetyTrust} compact={false} />);
    expect(screen.getByText('主辦：社群認證主辦人')).toBeInTheDocument();
  });
});
