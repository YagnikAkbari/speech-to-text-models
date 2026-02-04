import Link from "next/link";

const Navbar = () => {
  const links = [
    { href: "/", label: "Home" },
    { href: "/eleven-labs", label: "Eleven Labs" },
    { href: "/picovoice-proqupine", label: "Picovoice" },
    { href: "/vad-log", label: "VAD Log" },
    { href: "/web-audio", label: "Web Audio" },
    { href: "/whisper-fast-api", label: "Whisper FastAPI" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white font-bold text-xl">
              Jump My Boy
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
