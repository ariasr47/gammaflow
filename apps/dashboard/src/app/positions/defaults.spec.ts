/**
 * Unit — customization defaults + config equality (drives the unsaved-changes dot, AC-27/AC-28).
 */
import { describe, expect, it } from 'vitest';
import {
  defaultConfig, defaultView, defaultCustomization, cloneConfig, configEqual, DEFAULT_COLUMNS,
} from './defaults';

describe('defaults', () => {
  it('seeds the All positions default view (builtin, comfortable table, status=open, sort=pl$ desc)', () => {
    const v = defaultView();
    expect(v.name).toBe('All positions');
    expect(v.builtin).toBe(true);
    expect(v.config.layout).toBe('table');
    expect(v.config.density).toBe('comfortable');
    expect(v.config.group).toBe('none');
    expect(v.config.sortKey).toBe('pl_dollar');
    expect(v.config.sortDir).toBe('desc');
    expect(v.config.filter.status).toEqual(['open']);
    expect(v.config.columns).toEqual(DEFAULT_COLUMNS);
  });

  it('seeds the customization state with exactly the default view active', () => {
    const c = defaultCustomization();
    expect(c.views).toHaveLength(1);
    expect(c.activeViewId).toBe(c.views[0].id);
  });

  it('configEqual is true for an unmodified clone and false after an edit', () => {
    const a = defaultConfig();
    expect(configEqual(a, cloneConfig(a))).toBe(true);
    const b = cloneConfig(a); b.layout = 'card';
    expect(configEqual(a, b)).toBe(false);
  });

  it('configEqual is order-insensitive for the status multi-select', () => {
    const a = defaultConfig();
    const b = cloneConfig(a); b.filter.status = ['open'];
    expect(configEqual(a, b)).toBe(true);
  });
});
