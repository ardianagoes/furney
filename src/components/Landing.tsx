import { ArrowDown, ArrowRight, ArrowUpRight, Box, Leaf, Ruler, Wallet } from 'lucide-react';
import { RoomIllustration } from './RoomIllustration';

export function SiteHeader() {
  return <header className="site-header page-width">
      <a href="#" className="wordmark" aria-label="Furney home"><span className="brand-symbol">f</span>furney<span className="brand-dot">.</span></a>
      <nav aria-label="Main navigation" className="flex items-center gap-7">
        <a className="nav-link hidden sm:block" href="#how-it-works">How it works</a>
        <a className="button button-small" href="#planner">Open planner <ArrowUpRight size={15} /></a>
      </nav>
    </header>;
}

export function Landing() {
  return <>
      <section className="hero page-width" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> A little more at home</div>
          <h1 id="hero-heading">Good spaces.<br />Made <em>yours.</em></h1>
          <p className="hero-tagline">Your room. Your dimensions. Your budget.</p>
          <p className="hero-description">From that first apartment to your favorite corner.<br className="hidden md:block" /> Make room for the way you want to live.</p>
          <a href="#planner" className="button hero-cta">Start planning your room <ArrowRight size={18} /></a>
          <div className="hero-footnote"><Leaf size={14} /> A fresh start, one piece at a time.</div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit" />
          <div className="visual-label"><span className="status-dot" /> THE EVERYDAY RETREAT</div>
          <RoomIllustration className="hero-room" />
          <div className="room-label"><span className="room-label-icon"><Ruler size={18} /></span><div>A space that fits you<span>Thoughtful by design.</span></div></div>
          <span className="art-caption">An illustrated possibility. Your room is next.</span>
        </div>
      </section>
      <section id="how-it-works" aria-label="How Furney works" className="steps-strip page-width">
        <div className="step"><span className="step-icon"><Ruler size={20} /></span><div><strong>01 / Measure your space</strong><p>A few dimensions. A world of possibilities.</p></div></div>
        <div className="step"><span className="step-icon"><Box size={20} /></span><div><strong>02 / Find your pieces</strong><p>Explore IKEA furniture. Make it yours.</p></div></div>
        <div className="step"><span className="step-icon"><Wallet size={20} /></span><div><strong>03 / Keep it in budget</strong><p>See your estimate come together as you go.</p></div></div>
        <a href="#planner" className="steps-arrow" aria-label="Go to room planner"><ArrowDown size={20} /></a>
      </section>
  </>;
}
