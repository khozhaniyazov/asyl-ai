import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { SOAPTextArea } from './SOAPTextArea';

describe('SOAPTextArea', () => {
  it('renders label and textarea for subjective', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SOAPTextArea label="subjective" sectionKey="subjective" value="" onChange={onChange} />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays the current value', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SOAPTextArea label="objective" sectionKey="objective" value="Patient showed improvement" onChange={onChange} />
    );
    expect(screen.getByDisplayValue('Patient showed improvement')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <SOAPTextArea label="assessment" sectionKey="assessment" value="" onChange={onChange} />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Good progress');
    expect(onChange).toHaveBeenCalled();
  });

  it('applies correct border color for each section', () => {
    const { container } = renderWithProviders(
      <SOAPTextArea label="subjective" sectionKey="subjective" value="" onChange={vi.fn()} />
    );
    const wrapper = container.querySelector('.border-l-blue-400');
    expect(wrapper).not.toBeNull();
  });

  it('uses correct rows prop', () => {
    renderWithProviders(
      <SOAPTextArea label="plan" sectionKey="plan" value="" onChange={vi.fn()} rows={5} />
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});
