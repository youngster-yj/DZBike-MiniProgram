import { View } from '@tarojs/components';
import { ReactNode, useEffect, useState } from 'react';

const LEAVE_MS = 180;

export interface AnimatedModalProps {
  visible: boolean;
  children: ReactNode;
  /** Applied to the full-screen mask (existing *-modal classes) */
  maskClassName?: string;
  /** Applied to the white panel (existing *-modalBody classes) */
  bodyClassName?: string;
  onClose?: () => void;
  closeOnMask?: boolean;
}

/**
 * Keeps the modal mounted through a short leave animation when `visible` flips to false.
 * Parents should render this always (not `{visible && ...}`), passing `visible` only.
 */
export function AnimatedModal({
  visible,
  children,
  maskClassName = '',
  bodyClassName = '',
  onClose,
  closeOnMask = false,
}: AnimatedModalProps) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setLeaving(false);
      return undefined;
    }
    setLeaving(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setLeaving(false);
    }, LEAVE_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  const maskAnim = leaving ? 'dz-modal-mask-leave' : 'dz-modal-mask-enter';
  const bodyAnim = leaving ? 'dz-modal-body-leave' : 'dz-modal-body-enter';

  return (
    <View
      className={`${maskClassName} ${maskAnim}`.trim()}
      onClick={closeOnMask ? onClose : undefined}
    >
      <View
        className={`${bodyClassName} ${bodyAnim}`.trim()}
        onClick={(e) => {
          e.stopPropagation?.();
        }}
      >
        {children}
      </View>
    </View>
  );
}
