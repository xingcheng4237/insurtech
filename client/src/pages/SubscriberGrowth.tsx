/**
 * Public Subscriber Growth Page
 * Shows cumulative subscriber growth over time — no auth required.
 * Designed to be linkable from chengxing.org as professional CPO intel.
 */
import { trpc } from '@/lib/trpc';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const BRAND_BLUE = '#2563EB';
const LIGHT_BLUE = '#EFF6FF';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '24px 28px',
        minWidth: 140,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>
        Week of {label}
      </div>
      <div style={{ color: BRAND_BLUE }}>Total: <strong>{payload[0]?.value}</strong></div>
      {payload[1] && (
        <div style={{ color: '#10B981' }}>New this week: <strong>{payload[1]?.value}</strong></div>
      )}
    </div>
  );
}

export default function SubscriberGrowth() {
  const { data, isLoading, error } = trpc.growth.stats.useQuery();

  const chartData = data?.weeklyGrowth.map(w => ({
    week: w.week,
    total: w.total,
    new: w.newSubs,
  })) ?? [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '20px 0',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: BRAND_BLUE,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
              }}
            >
              📰
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>
                Insurtech News Tracker
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Subscriber Growth — Public Dashboard
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Newsletter Growth
        </h1>
        <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 36, maxWidth: 580 }}>
          Weekly insurtech intelligence for insurance leaders across Asia-Pacific.
          Tracking subscriber growth since launch.
        </p>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
            Loading growth data…
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '16px 20px',
              color: '#DC2626',
            }}
          >
            Could not load subscriber data. Please try again later.
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
              <StatCard label="Total Subscribers" value={data.total} sub="Active" />
              <StatCard label="Verified" value={data.verified} sub="Email confirmed" />
              <StatCard
                label="Latest Week"
                value={`+${data.latestWeekNewSubs}`}
                sub="New subscribers"
              />
              <StatCard
                label="Weeks Tracked"
                value={data.weeklyGrowth.length}
                sub="Since launch"
              />
            </div>

            {/* Growth chart */}
            {chartData.length > 0 ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '28px 24px 16px',
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#374151',
                    marginBottom: 24,
                  }}
                >
                  Cumulative Subscriber Growth
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_BLUE} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={BRAND_BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke={BRAND_BLUE}
                      strokeWidth={2.5}
                      fill="url(#blueGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: BRAND_BLUE }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  background: LIGHT_BLUE,
                  border: `1px solid ${BRAND_BLUE}33`,
                  borderRadius: 12,
                  padding: '40px',
                  textAlign: 'center',
                  color: BRAND_BLUE,
                  marginBottom: 32,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Growth tracking starts here</div>
                <div style={{ fontSize: 13, marginTop: 6, color: '#6B7280' }}>
                  Subscribe to start tracking weekly growth.
                </div>
              </div>
            )}

            {/* Milestones */}
            {data.milestones.length > 0 && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '24px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginBottom: 16 }}>
                  Milestones Reached 🎉
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {data.milestones.map(m => (
                    <div
                      key={m}
                      style={{
                        background: LIGHT_BLUE,
                        border: `1px solid ${BRAND_BLUE}33`,
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: BRAND_BLUE,
                      }}
                    >
                      {m} subscribers ✓
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscribe CTA */}
            <div
              style={{
                marginTop: 40,
                background: BRAND_BLUE,
                borderRadius: 12,
                padding: '32px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  Get the weekly digest
                </div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>
                  Every Friday — top insurtech news curated for APAC insurance leaders.
                </div>
              </div>
              <a
                href="https://insurtechnewstracker.chengxing.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#fff',
                  color: BRAND_BLUE,
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '10px 22px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Subscribe →
              </a>
            </div>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            © {new Date().getFullYear()} Insurtech News Tracker · Built by{' '}
            <a
              href="https://chengxing.org"
              style={{ color: BRAND_BLUE, textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xing Cheng
            </a>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            Covering 11 APAC markets · Powered by AI
          </div>
        </div>
      </div>
    </div>
  );
}
