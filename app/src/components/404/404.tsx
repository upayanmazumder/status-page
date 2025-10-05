import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <h1>404</h1>
      <p>The page you are looking for does not exist!</p>
      <Image
        src="/404.webp"
        width={1000}
        height={600}
        style={{ width: '100%', height: 'auto' }}
        alt="Not Found Image"
      />
    </main>
  );
}
