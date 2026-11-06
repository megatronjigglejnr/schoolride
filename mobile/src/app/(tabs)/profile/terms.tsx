// Terms & conditions (#sub-terms): plain reading text. Reached from Account (About) and from Privacy.
import { Enter } from '@/components/Enter';
import { Screen } from '@/components/shell/Screen';
import { TermsIntro, TermsSections } from '@/components/TermsBody';

export default function Terms() {
  return (
    <Screen compactHeader>
      <Enter index={0}>
        <TermsIntro />
      </Enter>
      <Enter index={1}>
        <TermsSections />
      </Enter>
    </Screen>
  );
}
