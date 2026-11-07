import { Landing, SiteHeader } from './components/Landing';
import { PlannerWorkspace } from './components/PlannerWorkspace';
import { PlannerProvider } from './state/PlannerProvider';

export default function App() {
  return <PlannerProvider>
    <a className="skip-link" href="#planner">Skip to room planner</a>
    <SiteHeader />
    <main id="main-content">
      <Landing />
      <PlannerWorkspace />
    </main>
    <footer className="site-footer page-width"><a className="footer-brand" href="#">furney.</a><p>A little more you. A little more home.</p><span>Built for a Brown University hackathon <span aria-hidden="true">↗</span></span></footer>
  </PlannerProvider>;
}
