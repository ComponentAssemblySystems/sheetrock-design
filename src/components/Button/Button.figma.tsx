import figma from '@figma/code-connect';
import { Button } from './Button';

/*
 * Replace FIGMA_COMPONENT_URL_HERE with the actual Figma component URL.
 * To find it: right-click the Button component in Figma → Copy link.
 */
figma.connect(Button, 'FIGMA_COMPONENT_URL_HERE', {
  props: {
    label: figma.string('Label'),
    variant: figma.enum('Variant', {
      Primary: 'primary',
      Secondary: 'secondary',
      Destructive: 'destructive',
    }),
    disabled: figma.boolean('Disabled'),
  },
  example: ({ label, variant, disabled }) => (
    <Button label={label} variant={variant} disabled={disabled} />
  ),
});
