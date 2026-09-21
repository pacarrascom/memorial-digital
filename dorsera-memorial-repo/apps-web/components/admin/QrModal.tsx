'use client';

import { Modal } from './Modal';
import { QrGenerator } from './QrGenerator';

export function QrModal({
  open,
  onClose,
  memorialId,
  personName,
}: {
  open: boolean;
  onClose: () => void;
  memorialId: string;
  personName?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Código QR del memorial">
      {personName && (
        <p className="-mt-2 mb-4 text-sm text-ink-500">{personName} — el puente hacia su historia</p>
      )}
      <QrGenerator memorialId={memorialId} />
    </Modal>
  );
}
