import { Button } from '@tarojs/components';

export interface ShareActionButtonProps {
  label?: string;
  fullWidth?: boolean;
  className?: string;
  onClick: () => void;
}

export function ShareActionButton({
  label,
  fullWidth = false,
  className = '',
  onClick,
}: ShareActionButtonProps) {
  const text = label ?? '分享';

  if (fullWidth) {
    return (
      <Button
        type="primary"
        hoverClass="none"
        className={`button-primary footer-action-btn share-action-btn--primary ${className}`.trim()}
        onClick={onClick}
      >
        {text}
      </Button>
    );
  }

  return (
    <Button
      hoverClass="none"
      className={`footer-action-btn share-action-btn ${className}`.trim()}
      onClick={onClick}
    >
      {text}
    </Button>
  );
}
