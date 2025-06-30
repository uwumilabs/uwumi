import Landing from "../components/landing";

export default function Home() {
  return (
    // this prevents the window to grow beyond the viewport size, because the animation of small balls increases the size of the window
    // and causes the scrollbar to appear, which is not desired
    <main className="min-h-screen min-w-screen overflow-hidden bg-background transition-colors duration-300">
      <Landing />
    </main>
  );
}
