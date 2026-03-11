'use client';

interface ActivityHeatmapProps {
  activityByDay: Record<string, number>;
  totalSubmissions: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.05)';
  if (count === 1) return 'rgba(60,175,246,0.25)';
  if (count <= 3) return 'rgba(60,175,246,0.50)';
  if (count <= 6) return 'rgba(60,175,246,0.75)';
  return 'rgba(60,175,246,1)';
}

export default function ActivityHeatmap({ activityByDay, totalSubmissions }: ActivityHeatmapProps) {
  // Build 365 days starting from the Sunday 364 days ago
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent Sunday (start of the last week column)
  const dayOfWeek = today.getDay(); // 0=Sun
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() - dayOfWeek + 6); // last Saturday

  // Start 52 full weeks + current week ago
  const start = new Date(today);
  start.setDate(today.getDate() - 364);
  // Align to Sunday
  const startDayOfWeek = start.getDay();
  start.setDate(start.getDate() - startDayOfWeek);

  // Build weeks array
  const weeks: { date: Date; count: number }[][] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const week: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      const count = activityByDay[key] ?? 0;
      const isFuture = cursor > today;
      week.push({ date: new Date(cursor), count: isFuture ? -1 : count });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels: find the first week where the month changes
  const monthLabels: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, idx) => {
    const firstDay = week.find(d => d.count >= 0)?.date ?? week[0].date;
    if (idx === 0 || firstDay.getDate() <= 7) {
      const label = MONTHS[firstDay.getMonth()];
      if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
        monthLabels.push({ weekIdx: idx, label });
      }
    }
  });

  const activeDays = Object.keys(activityByDay).length;

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Activity — {totalSubmissions} submissions
        </h2>
        <span className="text-xs text-slate-500">{activeDays} active days in the past year</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: weeks.length * 14 + 28 }}>
          {/* Month labels */}
          <div className="flex mb-1 pl-7">
            {weeks.map((_, idx) => {
              const label = monthLabels.find(m => m.weekIdx === idx);
              return (
                <div key={idx} style={{ width: 14, flexShrink: 0 }}>
                  {label && (
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{label.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col mr-1" style={{ gap: 2 }}>
              {DAYS.map((d, i) => (
                <div key={i} style={{ height: 11, fontSize: 9, color: '#64748b', lineHeight: '11px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: 2, marginRight: 2 }}>
                {week.map((day, di) => {
                  const isFuture = day.count < 0;
                  const key = day.date.toISOString().slice(0, 10);
                  const bg = isFuture ? 'transparent' : getColor(day.count);
                  const title = isFuture ? '' : `${key}: ${day.count} submission${day.count !== 1 ? 's' : ''}`;
                  return (
                    <div
                      key={di}
                      title={title}
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 2,
                        backgroundColor: bg,
                        border: isFuture ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        cursor: day.count > 0 ? 'default' : 'default',
                        transition: 'opacity 0.15s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 justify-end">
            <span className="text-[10px] text-slate-500">Less</span>
            {[0, 1, 3, 6, 7].map((v) => (
              <div
                key={v}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  backgroundColor: getColor(v),
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              />
            ))}
            <span className="text-[10px] text-slate-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
