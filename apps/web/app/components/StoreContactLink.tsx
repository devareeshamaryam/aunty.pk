'use client';

import { useStoreContact } from '../context/SettingsContext';

interface Props {
  className?: string;
  /** Show an icon-prefixed phone, e.g. on the order-success page. */
  withIcon?: boolean;
}

/**
 * Client-side phone link that always reflects the latest admin-configured
 * contact number from `/settings`. Falls back to defaults until loaded.
 */
export default function StoreContactLink({
  className = 'text-cyan-600 font-semibold',
}: Props) {
  const { phone, phoneDisplay } = useStoreContact();
  return (
    <a href={`tel:${phone}`} className={className}>
      {phoneDisplay}
    </a>
  );
}
