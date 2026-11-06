/**
 * The call sheet (renderCallSheet in the prototype), following CLAUDE.md's decided call rules:
 * - the driver comes first, as one direct call;
 * - school contacts are always listed and callable, never behind a toggle;
 * - Edit only chooses who is listed, and that choice is remembered per child (it lives in ChildContext);
 * - with the signal lost, the sheet leads with why calling the driver is the way to check in.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Sheet } from '@/components/Sheet';
import { SwitchTrack } from '@/components/Switch';
import { callData } from '@/data/calls';
import { children } from '@/data/children';
import { placeCall } from '@/lib/calls';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { alpha, color, rgb } from '@/theme/tokens';
import { font } from '@/theme/type';

export function CallSheet() {
  const { sheet, closeSheet, showToast } = useShell();
  const open = sheet === 'call';
  // Every opening starts out of Edit mode, as openSheet('call') does in the prototype.
  const [edit, setEdit] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setEdit(false);
  }

  return (
    <Sheet open={open} title="Call" onClose={closeSheet}>
      <CallSheetBody edit={edit} onToggleEdit={() => setEdit((e) => !e)} showToast={showToast} />
    </Sheet>
  );
}

export function CallSheetBody({
  edit,
  onToggleEdit,
  showToast,
}: {
  edit: boolean;
  onToggleEdit: () => void;
  showToast: (m: string) => void;
}) {
  const { activeChild, callPrefs, toggleCallPref, signal } = useChild();
  const { driver, contacts } = callData[activeChild];
  const name = children[activeChild].firstName;
  const shown = contacts.filter((c) => edit || callPrefs[c.id]);

  return (
    <>
      {signal.lost && (
        <View style={styles.alert} accessibilityRole="alert">
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>
            Signal lost {signal.lostMinutes} min ago. Calling the driver is the fastest way to check in.
          </Text>
        </View>
      )}

      <Press
        accessibilityRole="button"
        accessibilityLabel={`Call ${driver.name}, ${driver.role.toLowerCase()}`}
        onPress={() => placeCall(driver.phone, driver.name, showToast)}
        pressScale={0.98}
        style={styles.primary}>
        <View style={styles.primaryAvatar}>
          <Text style={styles.primaryInitial}>{driver.initial}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.primaryName}>{driver.name}</Text>
          <Text style={styles.primaryRole}>{driver.role}</Text>
        </View>
        <View style={styles.primaryBtn}>
          <Icon name="phone" size={22} />
        </View>
      </Press>

      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.headTitle}>
          School contacts
        </Text>
        <Press
          accessibilityRole="button"
          accessibilityLabel={edit ? 'Done' : 'Edit'}
          onPress={onToggleEdit}
          pressScale={0}
          style={styles.link}>
          <Text style={styles.linkText}>{edit ? 'Done' : 'Edit'}</Text>
        </Press>
      </View>

      {shown.length === 0 && (
        <Text style={styles.empty}>No school contacts in this list. Tap Edit to add them back.</Text>
      )}

      {shown.map((c, i) => {
        const rowStyle = [styles.row, i > 0 && styles.rowRule];
        const body = (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{c.initial}</Text>
            </View>
            <View style={styles.textCol}>
              <Text style={text.rowTitle}>{c.name}</Text>
              <Text style={styles.role}>{c.role}</Text>
            </View>
          </>
        );
        if (edit) {
          const on = callPrefs[c.id];
          return (
            <Press
              key={c.id}
              accessibilityRole="switch"
              accessibilityLabel={`Show ${c.name} in this list`}
              accessibilityState={{ checked: on }}
              onPress={() => toggleCallPref(c.id)}
              pressScale={0}
              style={rowStyle}>
              {body}
              <SwitchTrack on={on} />
            </Press>
          );
        }
        return (
          <Press
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Call ${c.name}, ${c.role}`}
            onPress={() => placeCall(c.phone, c.name, showToast)}
            pressScale={0.99}
            style={rowStyle}>
            {body}
            <View style={styles.rowBtn}>
              <Icon name="phone" size={18} color={color.onInk} />
            </View>
          </Press>
        );
      })}

      <Text style={styles.hint}>
        {edit
          ? 'Choose who appears here. You can add anyone back later.'
          : `Use these if ${name} is running late for class or an exam.`}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: color.alertSoft,
  },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: color.alert },
  alertText: { flex: 1, ...font(700), fontSize: 13, lineHeight: 18, color: color.ink },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: color.ink,
    boxShadow: `0 1px 1px ${alpha(rgb.ink, 0.2)}, 0 12px 26px -14px ${alpha(rgb.ink, 0.6)}, inset 0 1px 0 ${alpha(rgb.glint, 0.12)}`,
  },
  primaryAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: alpha(rgb.glint, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryInitial: { ...font(900), fontSize: 18, color: color.onInk },
  textCol: { flex: 1, minWidth: 0 },
  primaryName: { ...font(900), fontSize: 17, color: color.onInk },
  primaryRole: { ...font(600), fontSize: 13, color: alpha(rgb.glint, 0.8) },
  // The sheet's one marigold mark: the driver's call button.
  primaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  headTitle: { ...font(900), fontSize: 14, color: color.ink },
  link: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 12,
    paddingLeft: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  linkText: { ...font(800), fontSize: 14, color: color.ink, textDecorationLine: 'underline' },
  empty: { ...font(600), fontSize: 14, color: color.muted, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: color.line },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font(900), fontSize: 13, color: color.ink },
  role: { ...font(600), fontSize: 13, color: color.muted },
  rowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { ...text.caption, marginTop: 12 },
});
