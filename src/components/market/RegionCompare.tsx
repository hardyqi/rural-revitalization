"use client";

type Region = {
  province: string;
  avg_price: number;
  latest_date: string;
};

type Props = {
  data: Region[];
  loading?: boolean;
};

export default function RegionCompare({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-6 w-36 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">区域价格对比</h3>
        <p className="text-sm text-gray-400">暂无区域数据</p>
      </div>
    );
  }

  const prices = data.map((d) => d.avg_price);
  const overallAvg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">区域价格对比</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            全国均价 ¥{overallAvg.toFixed(1)} 元/公斤
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((region) => {
          const diff = region.avg_price - overallAvg;
          const pctDiff = overallAvg > 0 ? (diff / overallAvg * 100) : 0;
          const isHigh = diff > 0;

          return (
            <div
              key={region.province}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isHigh
                  ? "border-red-100 bg-red-50/30"
                  : "border-green-100 bg-green-50/30"
              }`}
            >
              <div className="text-sm font-medium text-gray-800 mb-1">
                {region.province}
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                ¥{region.avg_price.toFixed(1)}
              </div>
              <div
                className={`text-xs font-medium ${
                  isHigh ? "text-red-500" : "text-green-600"
                }`}
              >
                {isHigh ? "高于" : "低于"}均价 {Math.abs(pctDiff).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
