import type { ReactNode } from 'react';
import Modal from './ui/Modal';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Bump when nested above another modal (e.g. the prod-submit confirm over the GMC dialog). */
  zClassName?: string;
}

export default function ConfirmModal({
  title,
  children,
  confirmLabel,
  confirmClassName = 'px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 cursor-pointer transition-colors',
  onConfirm,
  onCancel,
  zClassName,
}: Props) {
  return (
    <Modal
      title={title}
      size="auto"
      zClassName={zClassName}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={confirmClassName}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
