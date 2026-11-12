import * as d3 from 'd3';
import { toSoraniNumber } from '../pipes/sorani-number.pipe';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export class D3ChartHelper {
  static renderBarChart(containerSelector: string, data: ChartDataPoint[], width = 380, height = 200): void {
    const container = d3.select(containerSelector);
    container.selectAll('*').remove();

    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, chartWidth])
      .domain(data.map((d: ChartDataPoint) => d.label))
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d: ChartDataPoint) => d.value) || 100])
      .range([chartHeight, 0]);

    const xAxis = d3.axisBottom(x).tickFormat((d: any) => toSoraniNumber(String(d)));
    const yAxis = d3.axisLeft(y).tickFormat((d: any) => toSoraniNumber(Number(d)));

    svg
      .append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis as any)
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    svg.append('g').call(yAxis as any);

    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: ChartDataPoint) => x(d.label) || 0)
      .attr('y', (d: ChartDataPoint) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d: ChartDataPoint) => chartHeight - y(d.value))
      .attr('fill', '#0d9488');

    svg
      .selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d: ChartDataPoint) => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', (d: ChartDataPoint) => y(d.value) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .text((d: ChartDataPoint) => toSoraniNumber(d.value));
  }
}

