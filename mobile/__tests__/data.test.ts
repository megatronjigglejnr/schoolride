// The ported mock data must match what the prototype actually holds (fixture written by npm run dump-prototype).
import { callData, defaultCallPrefs, lateContact } from '@/data/calls';
import { children } from '@/data/children';
import { historyData } from '@/data/history';
import { miniMapSpec, routeMaps } from '@/data/maps';
import { notifications } from '@/data/notifications';
import { examDaysByChild, TODAY } from '@/data/schedule';
import { trackData } from '@/data/track';
import { CHILD_KEYS } from '@/data/types';
import { DEMO_CALLS, OTP_CORRECT } from '@/lib/demo';
import { layout } from '@/lib/minimap';

import proto from './fixtures/prototype-data.json';

describe.each(CHILD_KEYS)('%s', (key) => {
  test('track data', () => {
    const p = proto.trackData[key];
    expect(trackData[key]).toEqual({
      title: p.name,
      etaMin: Number(p.eta),
      dest: p.dest,
      progress: p.progress,
      fillPct: p.fillPct,
      homeKm: p.homeKm,
      driver: { initial: p.driverInitial, name: p.driverName, role: p.driverRole },
      route: p.route.map((s) => ({ name: s.n, state: s.s })),
    });
    expect(children[key].firstName).toBe(p.firstName);
  });

  test('calls', () => {
    const p = proto.callData[key];
    expect(callData[key]).toEqual({
      driver: { initial: p.driverInitial, name: p.driverName, role: p.driverRole, phone: p.driverPhone },
      contacts: p.contacts,
    });
    // The prototype's callData.school holds the child's first name ("All contacts for Jane").
    expect(children[key].firstName).toBe(p.school);
    expect(defaultCallPrefs[key]).toEqual(proto.callPrefs[key]);
  });

  test('exam days and history', () => {
    expect(examDaysByChild[key]).toEqual(proto.examDaysByChild[key]);
    expect(historyData[key]).toEqual(proto.historyData[key].map((r) => ({ group: r.g, icon: r.icon, title: r.t, time: r.time })));
  });

  test('mini-map spec, and the geometry the prototype computes from it', () => {
    expect(miniMapSpec[key]).toEqual(proto.miniMapSpec[key]);
    const mine = layout(miniMapSpec[key]);
    const theirs = proto.miniMapLayout[key];
    expect(mine.donePath).toBe(theirs.donePath);
    expect(mine.restPath).toBe(theirs.restPath);
    expect(mine.bus[0]).toBeCloseTo(theirs.bus[0], 6);
    expect(mine.bus[1]).toBeCloseTo(theirs.bus[1], 6);
  });

  test('full route map', () => {
    const svg = proto.routeMaps[key];
    const m = routeMaps[key];
    const at = ([x, y]: readonly [number, number]) => `cx="${x}" cy="${y}"`;
    const label = ([x, y]: readonly [number, number]) => `x="${x}" y="${y}"`;
    expect(m.title).toBe(proto.routeTitles[key]);
    m.roads.forEach((r) => expect(svg).toContain(`d="${r}"`));
    expect(svg).toContain(`d="${m.route}"`);
    expect(svg).toContain(at(m.home.at));
    expect(svg).toContain(label(m.home.labelAt) + ` font-size="11"`);
    expect(svg).toContain(`>${m.home.label}</text>`);
    expect(svg).toContain(at(m.stop.at));
    expect(svg).toContain(label(m.stop.labelAt));
    expect(svg).toContain(`>${m.stop.label}</text>`);
    expect(svg).toContain(`<rect x="${m.school.at[0]}" y="${m.school.at[1]}"`);
    expect(svg).toContain(`>${m.school.letter}</text>`);
    expect(svg).toContain(label(m.school.labelAt));
    expect(svg).toContain(`>${m.school.label}</text>`);
    expect(svg.split(at(m.live)).length - 1).toBe(2); // the pulse ring and the dot
  });
});

test('notifications, with the tap target the prototype encoded as a function', () => {
  expect(notifications).toEqual(
    proto.notifications.map((n) => {
      const tab = n.goto?.match(/switchTab\('(\w+)'\)/)?.[1];
      const date = n.goto?.match(/calSelectDate\('([\d-]+)'\)/)?.[1];
      return {
        id: n.id,
        group: n.group,
        icon: n.icon,
        child: n.child,
        title: n.title,
        time: n.time,
        unread: n.unread,
        goto: !n.goto ? null : date ? { tab, date } : { tab },
      };
    }),
  );
});

test('constants', () => {
  expect(TODAY).toBe(proto.todayStr);
  expect(OTP_CORRECT).toBe(proto.OTP_CORRECT);
  expect(DEMO_CALLS).toBe(proto.DEMO_CALLS);
});

test('"Running late?": register teacher, then grade head, then nobody', () => {
  const { contacts } = callData.jane;
  expect(lateContact(contacts, { register: true, gradeHead: true })?.name).toBe('Mr. Coetzee');
  expect(lateContact(contacts, { register: false, gradeHead: true })?.name).toBe('Ms. Patel');
  expect(lateContact(contacts, { register: false, gradeHead: false })).toBeNull();
});
