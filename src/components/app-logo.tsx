import Image from "next/image";
import Link from "next/link";

export default function AppLogo({ href }: { href?: string }) {
  return (
    <Link href={href || "/"}>
      <div className="flex items-center gap-1.5">
        <div>
          <Image src={"/logo.svg"} width={24} height={24} alt="arcmark" />
        </div>
        <h1 className="text-xl font-semibold sm:text-2xl">
          Arc<span className="font-normal">Mark</span>
        </h1>
      </div>
    </Link>
  );
}
