import * as d3 from 'd3';
import { ConceptNodeModel, ConceptLinkModel } from './thesis-context-map';

export interface ConceptGraphConfig {
  width: number;
  height: number;
  containerSelector: string;
  onNodeClick?: (node: ConceptNodeModel) => void;
}

export class D3ConceptGraphHelper {
  private static simulation: d3.Simulation<any, any> | null = null;

  public static DEFAULT_NODES: ConceptNodeModel[] = [
    {
      id: 'methodology',
      name: 'Methodology',
      kurdishTranslation: 'میتۆدۆلۆژیی توێژینەوە',
      category: 'methodology',
      definition: 'شێواز و ڕێکاری زانستی بۆ کۆکردنەوە و شیکردنەوەی داتاکان.',
      importance: 'critical'
    },
    {
      id: 'hypothesis',
      name: 'Hypothesis',
      kurdishTranslation: 'فەرزنامە / پێشبینی زانستی',
      category: 'hypothesis',
      definition: 'پێشبینییەکی تاقیکراوە لەسەر پەیوەندی نێوان گۆڕاوەکان.',
      importance: 'critical'
    },
    {
      id: 'empirical_evidence',
      name: 'Empirical Evidence',
      kurdishTranslation: 'بەڵگەی مەیدانی / سەلمێنەر',
      category: 'evidence',
      definition: 'داتا و زانیاری ڕاستەوخۆ کە لە ڕێگەی تاقیکردنەوە یان چاودێرییەوە دەستکەوتووە.',
      importance: 'critical'
    },
    {
      id: 'literature_gap',
      name: 'Literature Gap',
      kurdishTranslation: 'کەلێنی توێژینەوە',
      category: 'gap',
      definition: 'ئەو بەشەی زانیاری کە لە توێژینەوەکانی پێشوودا وەڵام نەدراوەتەوە.',
      importance: 'high'
    },
    {
      id: 'theoretical_framework',
      name: 'Theoretical Framework',
      kurdishTranslation: 'چوارچێوەی تیۆری',
      category: 'theory',
      definition: 'تیۆر و مۆدێلە زانستییە بنەڕەتییەکان کە توێژینەوەکەی لەسەر بونیاد نراوە.',
      importance: 'high'
    },
    {
      id: 'findings',
      name: 'Findings & Results',
      kurdishTranslation: 'دەرئەنجامەکانی توێژینەوە',
      category: 'finding',
      definition: 'دەرئەنجامە بڕبڕەییەکان کە لە شیکاریی داتاکانەوە بەدەست هاتوون.',
      importance: 'high'
    }
  ];

  public static DEFAULT_LINKS: ConceptLinkModel[] = [
    { source: 'theoretical_framework', target: 'hypothesis', relation: 'forms', relationKurdish: 'دەبێتە بنما بۆ' },
    { source: 'hypothesis', target: 'methodology', relation: 'tested_by', relationKurdish: 'تاقی دەکرێتەوە لە ڕێگەی' },
    { source: 'methodology', target: 'empirical_evidence', relation: 'yields', relationKurdish: 'کۆدەکاتەوە' },
    { source: 'empirical_evidence', target: 'findings', relation: 'supports', relationKurdish: 'دەسەلمێنێت' },
    { source: 'literature_gap', target: 'hypothesis', relation: 'identifies_need_for', relationKurdish: 'پێویستی بەدیار دەخات بۆ' },
    { source: 'findings', target: 'literature_gap', relation: 'fills', relationKurdish: 'پڕی دەکاتەوە' }
  ];

  public static buildDynamicConceptGraphFromThesis(
    chapters: any[],
    glossaryTerms?: any[]
  ): { nodes: ConceptNodeModel[]; links: ConceptLinkModel[] } {
    const nodes: ConceptNodeModel[] = [];
    const links: ConceptLinkModel[] = [];
    const registeredIds = new Set<string>();

    const addNode = (n: ConceptNodeModel) => {
      if (!registeredIds.has(n.id)) {
        registeredIds.add(n.id);
        nodes.push(n);
      }
    };

    if (chapters && chapters.length > 0) {
      chapters.forEach((ch, chIdx) => {
        const chId = `ch_${ch.id || chIdx + 1}`;
        addNode({
          id: chId,
          name: ch.title || `Chapter ${chIdx + 1}`,
          kurdishTranslation: ch.title || `بەشی ${chIdx + 1}`,
          category: 'methodology',
          definition: `بەشی ئەکادیمی ژمارە ${chIdx + 1} (${ch.wordCount || 0} وشە)`,
          importance: 'critical'
        });

        if (chIdx > 0) {
          const prevChId = `ch_${chapters[chIdx - 1].id || chIdx}`;
          links.push({
            source: prevChId,
            target: chId,
            relation: 'leads_to',
            relationKurdish: 'دەبێتە سەرەتای'
          });
        }

        // Axes (Level 2)
        if (ch.axes && ch.axes.length > 0) {
          ch.axes.forEach((ax: any, axIdx: number) => {
            const axId = `ax_${ax.id || `${chId}_${axIdx + 1}`}`;
            addNode({
              id: axId,
              name: ax.title,
              kurdishTranslation: ax.title,
              category: 'theory',
              definition: `تەوەری شیکاری لە ${ch.title}`,
              importance: 'high'
            });

            links.push({
              source: chId,
              target: axId,
              relation: 'contains_axis',
              relationKurdish: 'تەوەری سەرەکی'
            });

            // Sub-branches (Level 3)
            if (ax.branches && ax.branches.length > 0) {
              ax.branches.forEach((b: any, bIdx: number) => {
                const bId = `br_${b.id || `${axId}_${bIdx + 1}`}`;
                addNode({
                  id: bId,
                  name: `${b.code} ${b.title}`,
                  kurdishTranslation: `${b.code} ${b.title}`,
                  category: 'evidence',
                  definition: `لقی شیکاری (${b.wordCount || 0} / ${b.targetWords || 0} وشە)`,
                  importance: 'medium'
                });

                links.push({
                  source: axId,
                  target: bId,
                  relation: 'branches_into',
                  relationKurdish: 'لقی شیکاری'
                });
              });
            }
          });
        }
      });
    }

    // Connect approved glossary terms
    const terms = glossaryTerms && glossaryTerms.length > 0 ? glossaryTerms.slice(0, 15) : [];
    terms.forEach((term: any) => {
      const termId = `gloss_${term.foreign?.toLowerCase().replace(/\\s+/g, '_') || term.translation}`;
      addNode({
        id: termId,
        name: term.foreign || term.translation,
        kurdishTranslation: term.translation,
        category: 'gap',
        definition: term.definition || 'زاراوەی ئەکادیمی پەسەندکراوی تێز.',
        importance: 'high'
      });

      const matchedChapter = chapters?.find((c: any) =>
        (c.title + ' ' + (c.content || '')).toLowerCase().includes(term.translation?.toLowerCase())
      );
      const targetId = matchedChapter ? `ch_${matchedChapter.id}` : (nodes[0]?.id || 'ch_1');
      if (targetId && registeredIds.has(targetId)) {
        links.push({
          source: termId,
          target: targetId,
          relation: 'conceptualizes',
          relationKurdish: 'چەمکسازی بۆ'
        });
      }
    });

    if (nodes.length === 0) {
      return {
        nodes: D3ConceptGraphHelper.DEFAULT_NODES,
        links: D3ConceptGraphHelper.DEFAULT_LINKS
      };
    }

    return { nodes, links };
  }

  public static renderForceGraph(
    config: ConceptGraphConfig,
    nodesData: ConceptNodeModel[],
    linksData: ConceptLinkModel[]
  ): void {
    const container = d3.select(config.containerSelector);
    container.selectAll('*').remove();

    if (!nodesData || nodesData.length === 0) return;

    const width = config.width || 600;
    const height = config.height || 450;

    // Create SVG element
    const svg = container
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .classed('select-none cursor-grab active:cursor-grabbing', true);

    // Zoom container
    const g = svg.append('g').attr('class', 'graph-viewport');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Deep clone data to avoid mutations during D3 simulation
    const nodes = nodesData.map((d) => ({ ...d }));
    const links = linksData.map((d) => ({
      source: d.source,
      target: d.target,
      relation: d.relation,
      relationKurdish: d.relationKurdish
    }));

    // Color scale by category
    const categoryColors: Record<string, string> = {
      methodology: '#0284c7', // Sky blue
      hypothesis: '#d97706',  // Amber
      evidence: '#16a34a',    // Emerald
      theory: '#9333ea',      // Purple
      gap: '#dc2626',         // Red
      finding: '#2563eb',     // Indigo
      general: '#4b5563'      // Neutral
    };

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    this.simulation = simulation;

    // Render links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d: any) => (d.relation === 'fills' ? '4,4' : 'none'));

    // Link labels
    const linkLabels = g.append('g').attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .text((d: any) => d.relationKurdish || d.relation)
      .attr('font-size', '9px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .attr('font-weight', '600');

    // Render nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .classed('node-item cursor-pointer', true)
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Node outer circle (glow/halo)
    node
      .append('circle')
      .attr('r', (d: any) => (d.importance === 'critical' ? 26 : 20))
      .attr('fill', (d: any) => categoryColors[d.category] || '#4b5563')
      .attr('fill-opacity', 0.15)
      .attr('stroke', (d: any) => categoryColors[d.category] || '#4b5563')
      .attr('stroke-width', 1.5);

    // Node core circle
    node
      .append('circle')
      .attr('r', (d: any) => (d.importance === 'critical' ? 18 : 14))
      .attr('fill', (d: any) => categoryColors[d.category] || '#4b5563')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Node labels (Kurdish text)
    node
      .append('text')
      .text((d: any) => d.kurdishTranslation || d.name)
      .attr('x', 0)
      .attr('y', (d: any) => (d.importance === 'critical' ? 34 : 28))
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b');

    // Node click event
    node.on('click', (event, d: any) => {
      event.stopPropagation();
      if (config.onNodeClick) {
        config.onNodeClick(d);
      }
    });

    // Simulation tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }
}
