import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer
} from 'recharts';

// Types for the different chart data structures
type BarChartData = {
  labels: string[];
  values: {
    data: number[];
    label: string;
  }[];
};

type LineChartData = {
  xValues: (number | string)[];
  yValues: {
    data: number[];
    label: string;
  }[];
};

type PieChartData = {
  label: string;
  value: number;
}[];

type ScatterChartData = {
  series: {
    data: {
      x: number;
      y: number;
      id: number;
    }[];
    label: string;
  }[];
};

// Generate colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Bar Chart Component
export const DataBarChart: React.FC<{
  data: BarChartData;
  horizontal?: boolean;
}> = ({ data, horizontal = false }) => {
  if (data.labels.length === 0 || data.values.length === 0) {
    return <div>No data available</div>;
  }

  // Get unique data keys from values array
  const dataKeys = data?.values ? Array.from(new Set(data?.values?.map(series => series.label))) : [];

  // Transform the data into the format Recharts expects
  // const transformedData = data.labels.map((label, index) => ({
  //   name: label,
  //   ...data.values.reduce((acc, series) => ({
  //     ...acc,
  //     [series.label]: series.data[index]
  //   }), {})
  // }));

  const transformedData = data.labels.map((label, index) => ({
    name: label,
    [data.values[index].label]: data.values[index].data
  })) || [{}];
  

  // Calculate max label length for left margin in horizontal mode
  const maxLabelLength = Math.max(...data.labels.map(label => label.length));
  const leftMargin = horizontal ? Math.min(maxLabelLength * 8, 200) : 60;

  // Determine value format based on first non-null value
  const firstValue = data.values[0]?.data[0];
  const isCurrency = typeof firstValue === 'number' && firstValue >= 1000;

  // Format value for tooltip based on data type
  const formatValue = (value: number) => {
    if (isCurrency) {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return value.toLocaleString();
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={transformedData}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{
            top: 20,
            right: 30,
            left: leftMargin,
            bottom: horizontal ? 20 : 100
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                domain={[0, 'auto']}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={leftMargin - 10}
                tick={{ fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                type="category"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                domain={[0, 'auto']}
              />
            </>
          )}
          <Tooltip formatter={formatValue} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
              name={key}
              minPointSize={2}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Line Chart Component
export const DataLineChart: React.FC<{
  data: LineChartData;
}> = ({ data }) => {
  const transformedData = data.xValues.map((x, index) => ({
    name: x,
    ...data.yValues.reduce((acc, series) => ({
      ...acc,
      [series.label]: series.data[index]
    }), {})
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={transformedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {data.yValues.map((series, index) => (
          <Line
            key={series.label}
            type="monotone"
            dataKey={series.label}
            stroke={COLORS[index % COLORS.length]}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Pie Chart Component
export const DataPieChart: React.FC<{
  data: PieChartData;
}> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          nameKey="label"
          label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Scatter Chart Component
export const DataScatterChart: React.FC<{
  data: ScatterChartData;
}> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="x" />
        <YAxis type="number" dataKey="y" name="y" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        {data.series.map((series, index) => (
          <Scatter
            key={series.label}
            name={series.label}
            data={series.data}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

// Chart Wrapper Component
export const ChartComponent: React.FC<{
  type: string; // 'bar' | 'horizontal_bar' | 'line' | 'pie' | 'scatter' 
  data: any;
}> = ({ type, data }) => {
  switch (type) {
    case 'bar':
      return <DataBarChart data={data} />;
    case 'horizontal_bar':
      return <DataBarChart data={data} horizontal />;
    case 'line':
      return <DataLineChart data={data} />;
    case 'pie':
      return <DataPieChart data={data} />;
    case 'scatter':
      return <DataScatterChart data={data} />;
    default:
      return <div>Unsupported chart type</div>;
  }
};

export default ChartComponent;