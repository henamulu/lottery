'use client';

import dynamic from 'next/dynamic';

const LotteryGenerator = dynamic(() => import('@/components/LotteryGenerator'), {
  loading: () => <div>Cargando...</div>
});

export default function Home() {
  return <LotteryGenerator />;
}
