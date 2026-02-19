import { useEffect, type ReactNode } from "react";

import Button from "./Button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
};

export default function Modal({ open, title, description, children, onClose, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="ui-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="ui-modal-header">
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>
        <section className="ui-modal-body">{children}</section>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </div>
    </div>
  );
}
