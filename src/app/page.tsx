import Portfolio from '@/components/Portfolio';
import Works from '@/components/Works';
import About from '@/components/About';
import ExitContent from '@/components/ExitContent';
import { createDesktopContent, repositoryIcons } from '@/components/DesktopContent';
import { goodbye } from '@/data/content';

/** Compose static content here so client containers never import its renderers. */
export default function Page() {
  return <Portfolio works={<Works />} about={<About />}
    desktopContent={createDesktopContent()} repositories={repositoryIcons}
    exitContent={<ExitContent />} exitFooter={goodbye.footer} restartLabel={goodbye.back} />;
}
