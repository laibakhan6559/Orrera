import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface NotFoundProps {
  title?: string;
  message?: string;
}

export default function NotFound({
  title = 'Lost in space',
  message = 'We could not find the page you were looking for. It may have moved, or the link may be mistyped.',
}: NotFoundProps) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-20 text-center sm:px-6">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-parchment sm:text-6xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-dust">{message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn btn-primary">
            <ArrowLeft size={18} aria-hidden="true" /> Back to home
          </Link>
          <Link to="/#planets" className="btn btn-ghost">
            Browse the planets
          </Link>
        </div>
      </div>
    </div>
  );
}
