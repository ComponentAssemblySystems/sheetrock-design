import { describe, it, expect } from 'vitest';
import { rgbaToHex, buildNestedPath, transformFigmaVariables } from '../scripts/transform-figma-vars.js';

describe('rgbaToHex', () => {
  it('converts opaque white RGBA float to hex', () => {
    expect(rgbaToHex({ r: 1, g: 1, b: 1, a: 1 })).toBe('#ffffff');
  });

  it('converts black to hex', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
  });

  it('returns rgba() string for transparent colors', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 0.5 })).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('converts an arbitrary color correctly', () => {
    expect(rgbaToHex({ r: 0.2, g: 0.4, b: 0.8, a: 1 })).toBe('#3366cc');
  });
});

describe('buildNestedPath', () => {
  it('sets a value at a single-segment path', () => {
    const obj = {};
    buildNestedPath(obj, ['white'], { $value: '#fff', $type: 'color' });
    expect(obj).toEqual({ white: { $value: '#fff', $type: 'color' } });
  });

  it('sets a value at a multi-segment path', () => {
    const obj = {};
    buildNestedPath(obj, ['colors', 'primary', '500'], { $value: '#0070f3', $type: 'color' });
    expect(obj.colors.primary['500'].$value).toBe('#0070f3');
  });

  it('does not overwrite sibling keys', () => {
    const obj = {};
    buildNestedPath(obj, ['colors', 'primary', '500'], { $value: '#0070f3', $type: 'color' });
    buildNestedPath(obj, ['colors', 'primary', '600'], { $value: '#0060cc', $type: 'color' });
    expect(Object.keys(obj.colors.primary)).toEqual(['500', '600']);
  });
});

describe('transformFigmaVariables', () => {
  const fixture = {
    schemaVersion: 1,
    collections: [
      {
        id: 'VariableCollectionId:4:2',
        name: 'Colors',
        modes: [
          { name: 'Light', modeId: '50:0' },
          { name: 'Dark', modeId: '437:1' }
        ],
        variableIds: ['VariableID:1:1', 'VariableID:1:2', 'VariableID:1:3']
      }
    ],
    variables: [
      {
        id: 'VariableID:1:1',
        name: 'cas/white',
        resolvedType: 'COLOR',
        valuesByMode: {
          '50:0': { r: 1, g: 1, b: 1, a: 1 },
          '437:1': { r: 0.1, g: 0.1, b: 0.1, a: 1 }
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      },
      {
        id: 'VariableID:1:2',
        name: 'spacing/sm',
        resolvedType: 'FLOAT',
        valuesByMode: {
          '50:0': 8,
          '437:1': 8
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      },
      {
        id: 'VariableID:1:3',
        name: 'text/primary',
        resolvedType: 'COLOR',
        valuesByMode: {
          '50:0': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' },
          '437:1': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' }
        },
        variableCollectionId: 'VariableCollectionId:4:2'
      }
    ]
  };

  it('produces light and dark token objects', () => {
    const { light, dark } = transformFigmaVariables(fixture);
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
  });

  it('converts a COLOR variable to hex in light mode', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.cas.white.$value).toBe('#ffffff');
    expect(light.cas.white.$type).toBe('color');
  });

  it('converts a COLOR variable to hex in dark mode', () => {
    const { dark } = transformFigmaVariables(fixture);
    expect(dark.cas.white.$value).toBe('#1a1a1a');
  });

  it('converts a FLOAT variable to a px dimension string', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.spacing.sm.$value).toBe('8px');
    expect(light.spacing.sm.$type).toBe('dimension');
  });

  it('converts a VARIABLE_ALIAS to a W3C token reference', () => {
    const { light } = transformFigmaVariables(fixture);
    expect(light.text.primary.$value).toBe('{cas.white}');
  });

  it('skips tokens with unresolvable external aliases', () => {
    const fixtureWithExternal = {
      schemaVersion: 1,
      collections: [
        {
          id: 'VariableCollectionId:4:2',
          name: 'Colors',
          modes: [
            { name: 'Light', modeId: '50:0' },
            { name: 'Dark', modeId: '437:1' }
          ],
          variableIds: ['VariableID:1:1', 'VariableID:ext:1']
        }
      ],
      variables: [
        {
          id: 'VariableID:1:1',
          name: 'cas/white',
          resolvedType: 'COLOR',
          valuesByMode: {
            '50:0': { r: 1, g: 1, b: 1, a: 1 },
            '437:1': { r: 1, g: 1, b: 1, a: 1 }
          },
          variableCollectionId: 'VariableCollectionId:4:2'
        },
        {
          id: 'VariableID:ext:1',
          name: 'text/primary',
          resolvedType: 'COLOR',
          valuesByMode: {
            '50:0': { type: 'VARIABLE_ALIAS', id: 'VariableID:external-library-hash/4:38' },
            '437:1': { type: 'VARIABLE_ALIAS', id: 'VariableID:external-library-hash/4:39' }
          },
          variableCollectionId: 'VariableCollectionId:4:2'
        }
      ]
    };
    const { light } = transformFigmaVariables(fixtureWithExternal);
    // text/primary should be skipped, not emit {undefined}
    expect(light.text).toBeUndefined();
    // cas/white should still be present
    expect(light.cas.white.$value).toBe('#ffffff');
  });
});
