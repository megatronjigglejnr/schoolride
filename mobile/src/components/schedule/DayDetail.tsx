// The selected day (calSelectDate in the prototype). On an exam day it shows the adjusted pickup, why it
// changed, and "Running late?": the register teacher first, the grade head as fallback, nothing if the parent
// hid both in the call sheet's Edit mode (CLAUDE.md, "Calls").
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { callData, lateContact } from '@/data/calls';
import type { ChildKey, ExamDay } from '@/data/types';
import { placeCall } from '@/lib/calls';
import { dayLabel, groupNote } from '@/lib/calendar';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';
import { text } from '@/theme/text';

export function DayDetail({ date, exam, child }: { date: string; exam?: ExamDay; child: ChildKey }) {
  const { callPrefs } = useChild();
  const { showToast } = useShell();
  const late = exam ? lateContact(callData[child].contacts, callPrefs) : null;

  return (
    <Card style={styles.card}>
      <Text style={styles.date}>{dayLabel(date)}</Text>
      {exam ? (
        <>
          <View style={[styles.badge, styles.badgeExam]}>
            <Text style={[styles.badgeText, styles.badgeTextExam]}>Exam day — pickup adjusted</Text>
          </View>
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={`Pickup at ${exam.pickup}`}
            style={styles.pickupRow}>
            <View style={styles.markWrap}>
              <View style={styles.mark} />
              <Text style={styles.pickup}>{exam.pickup}</Text>
            </View>
            <Text style={styles.pickupUnit}> pickup</Text>
          </View>
          <Text style={styles.note}>
            {exam.subject}. {groupNote(exam.grouped)}
          </Text>
          {late && (
            <Press
              accessibilityRole="button"
              accessibilityLabel={`Running late? Call ${late.name}, ${late.role}`}
              onPress={() => placeCall(late.phone, late.name, showToast)}
              pressScale={0.98}
              style={styles.late}>
              <View style={styles.lateText}>
                <Text style={styles.lateTitle}>Running late?</Text>
                <Text style={styles.lateWho}>
                  Call {late.name}, {late.role.toLowerCase()}
                </Text>
              </View>
              <View style={styles.lateBtn}>
                <Icon name="phone" size={18} color={color.onInk} />
              </View>
            </Press>
          )}
        </>
      ) : (
        <>
          <View style={[styles.badge, styles.badgeRegular]}>
            <Text style={styles.badgeText}>Regular day</Text>
          </View>
          <Text style={styles.note}>No exam scheduled — the usual route and pickup order apply.</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  date: { ...text.label, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 10 },
  badgeExam: { backgroundColor: color.ink },
  badgeRegular: { backgroundColor: color.surfaceFlat },
  badgeText: { ...font(700), fontSize: 12, color: color.ink },
  badgeTextExam: { ...font(800), color: color.onInk },
  pickupRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6, marginBottom: 10 },
  markWrap: { paddingHorizontal: 4, marginHorizontal: -4 },
  // The prototype's <mark>: a soft marigold band under the lower 40% of the time.
  mark: { position: 'absolute', left: 0, right: 0, bottom: 4, height: '40%', backgroundColor: color.accentSoft },
  pickup: { ...font(900), fontSize: 56, lineHeight: 58, color: color.ink, fontVariant: ['tabular-nums'], ...tracking(-0.045, 56) },
  pickupUnit: { ...font(800), fontSize: 18, color: color.muted },
  note: { ...font(400), fontSize: 12.5, lineHeight: 19, color: color.muted, marginTop: 4 },
  late: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    minHeight: 60,
    paddingVertical: 8,
    paddingRight: 8,
    paddingLeft: 16,
    borderRadius: 18,
    backgroundColor: color.accentSoft,
  },
  lateText: { flex: 1 },
  lateTitle: { ...font(900), fontSize: 15, color: color.ink },
  lateWho: { ...font(600), fontSize: 13, lineHeight: 17, color: color.ink },
  lateBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
});
