import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { CitationLink, CitationNode } from './d3-citation-graph.models';

@Injectable({ providedIn: 'root' })
export class D3CitationGraphRendererService {
  render(
    container: HTMLDivElement,
    allNodes: CitationNode[],
    allLinks: CitationLink[],
    filterType: 'all' | 'chapter' | 'theme' | 'source',
    searchQuery: string,
    onNodeSelected: (node: CitationNode) => void
  ): void {
        container.innerHTML = '';

    const width = container.clientWidth || 650;
    const height = 380;

    let nodesToRender = [...allNodes];
    if (filterType !== 'all') {
      nodesToRender = nodesToRender.filter((n) => n.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      nodesToRender = nodesToRender.filter(
        (n) => n.label.toLowerCase().includes(q) || (n.subLabel && n.subLabel.toLowerCase().includes(q))
      );
    }

    const nodeIds = new Set(nodesToRender.map((n) => n.id));
    const linksToRender: CitationLink[] = allLinks
      .filter((l) => {
        const sId = typeof l.source === 'object' ? (l.source as CitationNode).id : l.source;
        const tId = typeof l.target === 'object' ? (l.target as CitationNode).id : l.target;
        return nodeIds.has(sId) && nodeIds.has(tId);
      })
      .map((l) => ({ ...l }));

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
    svg.call(zoom as any);

    // D3 Force Simulation
    const simulation = d3
      .forceSimulation<CitationNode>(nodesToRender)
      .force(
        'link',
        d3
          .forceLink<CitationNode, CitationLink>(linksToRender)
          .id((d) => d.id)
          .distance(90)
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(28));

        // Draw Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(linksToRender)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => (d.relation === 'used_in_chapter' ? '3,3' : null));

    // Draw Nodes
    const node = g
      .append('g')
      .selectAll('.node-group')
      .data(nodesToRender)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (_, d) => onNodeSelected(d));

    // Circle Node styling by type
    node
      .append('circle')
      .attr('r', (d) => (d.type === 'chapter' ? 22 : d.type === 'theme' ? 18 : 14))
      .attr('fill', (d) => (d.type === 'chapter' ? '#6366f1' : d.type === 'theme' ? '#f59e0b' : '#10b981'))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5)
      .attr('shadow-lg', 'true');

    // Icon or Text inside Circle
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', '#ffffff')
      .attr('font-size', (d) => (d.type === 'chapter' ? '11px' : '9px'))
      .attr('font-weight', 'bold')
      .text((d) => (d.type === 'chapter' ? '📖' : d.type === 'theme' ? '🏷️' : '📚'));

    // Label under circle
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.type === 'chapter' ? '2.3em' : '2.1em'))
      .attr('fill', '#e2e8f0')
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .text((d) => (d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label));

    // Drag capability
    node.call(
      d3
        .drag<SVGGElement, CitationNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any
    );

    // Simulation Tick Update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }
}
