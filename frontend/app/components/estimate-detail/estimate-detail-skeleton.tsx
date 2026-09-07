/**
 * 詳細画面の読み込み中表示
 *
 * スピナーではなく、実際のレイアウトと同じ骨格を出す。
 * 読み込み完了時に要素が飛ばず、どこに何が来るかが先に分かる。
 */
export default function EstimateDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6">
      <span className="sr-only">読み込み中</span>

      <div className="mb-5 space-y-2">
        <div className="h-5 w-64 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-36 animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-96 animate-pulse rounded-lg border border-border bg-card lg:h-[32rem]" />
      </div>
    </div>
  );
}
