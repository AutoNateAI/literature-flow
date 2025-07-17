-- Add Literature Review AI prompts to the database (without user_id constraint)

-- Insert Setup and Planning Prompts
INSERT INTO public.prompts (title, description, content, category, tags, difficulty_level, estimated_time) VALUES
('Research Question Refinement', 'Refine your broad research interest into a focused, specific research question with clear scope and significance.', 'Help me refine my research interest in [BROAD TOPIC] into a focused research question.

Specifically, I''m interested in:
- [SPECIFIC ASPECT 1]
- [SPECIFIC ASPECT 2]
- [SPECIFIC ASPECT 3]

For my research question:
1. Propose 3-5 clearly formulated research questions
2. For each question, explain why it''s significant
3. Identify key concepts that should be included
4. Suggest limitations for scope (time period, populations, etc.)
5. Recommend inclusion/exclusion criteria for my literature review', 'Setup and Planning', ARRAY['research-question', 'planning', 'scope'], 'Beginner', '15-20 minutes'),

('Search Strategy Development', 'Create a comprehensive search strategy with Boolean operators, databases, and systematic documentation approach.', 'Based on my research question:
[INSERT RESEARCH QUESTION]

Help me develop a comprehensive search strategy that includes:
1. Primary search terms with Boolean operators (AND, OR, NOT)
2. Secondary terms and synonyms to include
3. Key databases to search (e.g., PubMed, Web of Science, ACM Digital Library)
4. Recommended filters (publication years, methodologies, languages)
5. Suggestions for citation tracking and reference list checking
6. Gray literature sources worth exploring
7. A structured approach to document my search process

My field of study is [YOUR FIELD], and I''m particularly interested in [SPECIFIC INTERESTS].', 'Setup and Planning', ARRAY['search-strategy', 'databases', 'documentation'], 'Intermediate', '20-30 minutes'),

('Literature Tracking System', 'Design a comprehensive system to track and organize papers throughout your literature review process.', 'Design a comprehensive tracking system for my literature review on [TOPIC] that I can implement in Notion, Excel, or a similar tool.

Include fields for:
1. Citation information (author, title, journal, year, DOI)
2. Research design and methodology
3. Sample characteristics
4. Key findings related to my research question
5. Limitations noted by authors
6. Quality assessment criteria
7. Key quotes worth referencing
8. My own notes and reflections
9. Relevance rating (high/medium/low)
10. Themes or categories for grouping

Provide a template structure with example entries to help me get started.', 'Setup and Planning', ARRAY['organization', 'tracking', 'templates'], 'Beginner', '25-30 minutes'),

-- Insert Paper Analysis Prompts
('Comprehensive Paper Summary', 'Generate detailed summaries of individual papers including methodology, findings, and theoretical frameworks.', 'Provide a comprehensive summary of this academic paper:
[PASTE PAPER TEXT OR TITLE/ABSTRACT]

Include:
1. Full citation information
2. Research objectives and questions addressed
3. Theoretical framework or conceptual model used
4. Methodology (design, sample, measures, procedures)
5. Key findings organized by research questions/objectives
6. Stated limitations and future research directions
7. Practical or theoretical implications
8. Connections to [MY RESEARCH FOCUS]
9. Key quotations worth noting (with page numbers if available)

Format this summary for easy reference later in my literature review.', 'Paper Analysis', ARRAY['summary', 'analysis', 'methodology'], 'Intermediate', '20-25 minutes'),

('Theoretical Framework Extraction', 'Extract and analyze the theoretical frameworks used in research papers for deeper understanding.', 'Analyze the theoretical framework used in this paper:
[PASTE PAPER TEXT]

1. Identify the primary theory or theories explicitly mentioned
2. Extract how authors have defined key theoretical constructs
3. Describe how theory informed their research questions and design
4. Explain how findings were interpreted within the theoretical framework
5. Note any theoretical contradictions or expansions proposed
6. Evaluate how well the theory was integrated throughout the paper
7. Compare with other common theoretical approaches in this field
8. Suggest how this theoretical approach relates to my interest in [YOUR FOCUS]', 'Paper Analysis', ARRAY['theory', 'framework', 'analysis'], 'Advanced', '25-30 minutes'),

('Methodology Evaluation', 'Conduct detailed methodological analysis and evaluation of research papers.', 'Conduct a detailed methodological analysis of this paper:
[PASTE METHODS SECTION OR FULL PAPER]

Assess:
1. Research design appropriateness for the research questions
2. Sampling approach, size, and representativeness
3. Data collection methods and instruments (validity, reliability)
4. Analytical techniques and their suitability
5. How limitations were addressed or acknowledged
6. Ethical considerations mentioned
7. Methodological strengths and innovations
8. Potential methodological improvements
9. How this methodology compares to standards in [YOUR FIELD]

Format this as a structured evaluation I can use to compare methods across studies.', 'Paper Analysis', ARRAY['methodology', 'evaluation', 'research-design'], 'Advanced', '30-35 minutes'),

('Results Extraction', 'Systematically extract and organize all findings from research papers for easy reference.', 'Extract and organize all findings from this paper:
[PASTE RESULTS SECTION OR FULL PAPER]

Provide:
1. Primary outcomes and results with specific data points
2. Statistical significance and effect sizes for quantitative studies
3. Key themes and supporting evidence for qualitative studies
4. Secondary or exploratory findings
5. Unexpected or null results
6. Visual representation of findings (described textually)
7. Authors'' interpretation of the results
8. How these findings relate to my research focus on [YOUR FOCUS]

Present this information in a structured, easily referenceable format.', 'Paper Analysis', ARRAY['results', 'findings', 'data-extraction'], 'Intermediate', '15-20 minutes'),

('Critical Evaluation', 'Critically evaluate research papers for strengths, limitations, and overall contribution to the field.', 'Critically evaluate this research paper:
[PASTE PAPER TEXT]

Address:
1. Strengths of the study (methodological, theoretical, practical)
2. Limitations or weaknesses (acknowledged and unacknowledged)
3. Potential biases or conflicts of interest
4. Quality of evidence presented
5. Validity of conclusions drawn from the data
6. Generalizability of findings
7. Ethical considerations
8. How this study compares to others on similar topics
9. Overall contribution to the field of [YOUR FIELD]

Provide this evaluation in a balanced, academic tone I can reference in my review.', 'Paper Analysis', ARRAY['critical-evaluation', 'quality-assessment', 'analysis'], 'Advanced', '25-30 minutes'),

-- Insert Batch Processing Prompts
('Multi-Paper Theme Identification', 'Identify and organize key themes across multiple papers for thematic analysis.', 'Analyze these paper summaries on [TOPIC] and identify key themes:
[PASTE MULTIPLE PAPER SUMMARIES]

For this analysis:
1. Identify 5-7 major themes that emerge across these papers
2. For each theme, note which papers address it and their key findings
3. Highlight areas of consensus among researchers
4. Identify contradictions or debates within each theme
5. Note methodological approaches used to study each theme
6. Suggest how these themes relate to each other
7. Indicate which themes appear most established vs. emerging

Present the results as a thematic map I can use to structure my literature review.', 'Batch Processing', ARRAY['themes', 'multiple-papers', 'organization'], 'Intermediate', '30-40 minutes'),

('Chronological Development Analysis', 'Analyze how research in your field has evolved over time through chronological examination.', 'Analyze how research on [TOPIC] has evolved over time based on these papers:
[PASTE PAPER SUMMARIES WITH DATES]

Create a chronological analysis that:
1. Identifies major phases or shifts in research focus
2. Tracks the evolution of key theories or frameworks
3. Notes methodological trends and innovations over time
4. Highlights landmark or seminal studies and their impact
5. Shows how research questions have changed or expanded
6. Indicates how technological or societal changes have influenced the research
7. Projects potential future directions based on recent trends

Format this as a narrative chronology with key milestones highlighted.', 'Batch Processing', ARRAY['chronological', 'evolution', 'trends'], 'Advanced', '35-45 minutes'),

('Methodological Comparison', 'Compare and contrast methodological approaches across multiple studies systematically.', 'Compare the methodological approaches used across these studies on [TOPIC]:
[PASTE PAPER SUMMARIES]

Create a methodological comparison that:
1. Categorizes studies by research design (experimental, correlational, qualitative, etc.)
2. Compares sample characteristics and sampling strategies
3. Analyzes measurement approaches and instruments used
4. Contrasts analytical techniques employed
5. Evaluates strengths and limitations of each methodological approach
6. Identifies innovative methods worth noting
7. Suggests underutilized methods that could advance the field
8. Recommends methodological best practices based on this analysis

Format this as a comparative analysis I can reference when discussing methodology.', 'Batch Processing', ARRAY['methodology', 'comparison', 'analysis'], 'Advanced', '40-50 minutes'),

('Contradictory Findings Analysis', 'Analyze and reconcile contradictory or inconsistent findings across multiple studies.', 'Analyze contradictory or inconsistent findings across these papers on [TOPIC]:
[PASTE RELEVANT PAPER SUMMARIES]

For each area of contradiction:
1. Clearly state the nature of the contradictory findings
2. Identify possible explanations for the contradictions:
   - Methodological differences
   - Sample variations
   - Contextual factors
   - Operational definitions
   - Time period differences
   - Theoretical frameworks used
3. Evaluate the strength of evidence on each side
4. Suggest research approaches that might resolve the contradiction
5. Discuss implications of these contradictions for theory and practice

Present this analysis in a structured format focusing on key contradictions.', 'Batch Processing', ARRAY['contradictions', 'analysis', 'reconciliation'], 'Advanced', '30-40 minutes'),

-- Insert Synthesis Prompts
('Literature Synthesis', 'Synthesize findings across multiple studies into a coherent narrative for your literature review.', 'Synthesize the literature on [TOPIC] based on these paper summaries:
[PASTE SUMMARIES OR REFERENCE NOTEBOOK]

Create a comprehensive synthesis that:
1. Integrates findings across studies into a coherent narrative
2. Organizes insights by the key themes:
   [LIST YOUR IDENTIFIED THEMES]
3. Highlights the strength of evidence for each major conclusion
4. Articulates areas of scholarly consensus and disagreement
5. Places findings in theoretical context
6. Discusses practical implications of the collective evidence
7. Identifies patterns in how research has approached this topic
8. Connects this synthesis to my research focus on [YOUR FOCUS]

Format this as a scholarly synthesis I can adapt for my literature review.', 'Synthesis', ARRAY['synthesis', 'integration', 'narrative'], 'Advanced', '45-60 minutes'),

('Conceptual Framework Development', 'Develop a comprehensive conceptual framework integrating theories and findings from your literature review.', 'Based on my literature review on [TOPIC], help me develop a conceptual framework that:

1. Integrates the major theoretical perspectives identified:
   [LIST KEY THEORIES]
2. Maps relationships between core concepts:
   [LIST KEY CONCEPTS]
3. Incorporates empirical findings on relationships between variables
4. Shows pathways or mechanisms suggested by the research
5. Highlights areas of uncertainty or competing explanations
6. Positions my specific research interest within this framework
7. Builds upon existing frameworks while addressing limitations

Describe this framework in detail and suggest how it could be visualized as a conceptual model or diagram.', 'Synthesis', ARRAY['framework', 'conceptual-model', 'theory'], 'Advanced', '50-70 minutes'),

('Research Gap Analysis', 'Conduct comprehensive analysis to identify research gaps and opportunities for future study.', 'Based on my literature review on [TOPIC], conduct a comprehensive gap analysis:

1. Identify explicit gaps mentioned by authors in their future research sections
2. Detect implicit gaps based on:
   - Limitations across multiple studies
   - Inconsistent or contradictory findings
   - Theoretical weaknesses or assumptions
   - Methodological shortcomings
   - Underrepresented populations or contexts
   - Emerging phenomena not yet well-studied
3. Categorize gaps as theoretical, methodological, contextual, or practical
4. Assess the significance of each gap to advancing knowledge in the field
5. Evaluate which gaps align with my research interests in [YOUR INTEREST]
6. Suggest how addressing these gaps could contribute to theory or practice
7. Recommend specific research questions that would address priority gaps

Present this as a structured gap analysis I can use to position my research.', 'Synthesis', ARRAY['gaps', 'opportunities', 'future-research'], 'Advanced', '40-55 minutes'),

('Interdisciplinary Connection', 'Explore connections between your topic and other disciplines to identify cross-disciplinary insights.', 'Analyze how my topic of [TOPIC] connects to other disciplines beyond [MY FIELD]:

1. Identify 3-5 other disciplines that have studied related phenomena
2. Compare how these disciplines conceptualize and approach the topic
3. Note key theories, frameworks, or methods from other disciplines that could be valuable
4. Highlight interdisciplinary studies that have successfully bridged these fields
5. Suggest specific concepts or approaches worth borrowing from other disciplines
6. Identify potential interdisciplinary collaborations that could advance knowledge
7. Discuss how an interdisciplinary approach might address existing gaps

Format this as an interdisciplinary analysis that enriches my literature review.', 'Synthesis', ARRAY['interdisciplinary', 'cross-field', 'connections'], 'Advanced', '35-45 minutes'),

-- Insert Output Generation Prompts
('Literature Review Introduction', 'Draft a compelling introduction for your literature review that establishes importance and scope.', 'Draft an introduction for my literature review on [TOPIC] that:

1. Establishes the importance and relevance of the topic
2. Clearly states my specific focus and research question:
   [YOUR RESEARCH QUESTION]
3. Briefly explains the scope of the review (time period, types of studies, etc.)
4. Provides context on the current state of knowledge
5. Outlines the structure of the review organized by:
   [YOUR MAJOR THEMES]
6. States the purpose and contribution of this review
7. Includes appropriate academic language and transitions

Write this in a formal academic style suitable for [INTENDED AUDIENCE/PUBLICATION].', 'Output Generation', ARRAY['introduction', 'writing', 'academic'], 'Intermediate', '30-40 minutes'),

('Methods Section for Literature Review', 'Create a detailed methods section documenting your systematic approach to the literature review.', 'Draft a methods section for my literature review on [TOPIC] that:

1. Describes my search strategy including:
   - Databases and sources searched
   - Key search terms and Boolean operators used
   - Inclusion and exclusion criteria
   - Date ranges considered
2. Explains my approach to:
   - Study selection process
   - Quality assessment criteria
   - Data extraction method
   - Synthesis approach
3. Includes appropriate citations for methodological approaches
4. Provides sufficient detail for reproducibility
5. Acknowledges any limitations in the search or selection process

Format this as a formal methods section appropriate for [INTENDED AUDIENCE/PUBLICATION].', 'Output Generation', ARRAY['methods', 'systematic', 'documentation'], 'Intermediate', '25-35 minutes'),

('Literature Review Conclusion', 'Write a strong conclusion that synthesizes findings and suggests future directions.', 'Draft a conclusion section for my literature review on [TOPIC] that:

1. Summarizes the key findings across the major themes:
   [LIST YOUR MAJOR THEMES]
2. Synthesizes the state of knowledge in the field
3. Highlights significant gaps and contradictions in the literature
4. Discusses implications for theory, research, and practice
5. Suggests specific directions for future research
6. Connects back to my original research question:
   [YOUR RESEARCH QUESTION]
7. Ends with a compelling statement about the importance of further work in this area

Write this in a formal academic style suitable for [INTENDED AUDIENCE/PUBLICATION].', 'Output Generation', ARRAY['conclusion', 'synthesis', 'future-directions'], 'Intermediate', '25-35 minutes'),

('Abstract Generation', 'Generate a comprehensive abstract summarizing your entire literature review.', 'Based on my completed literature review on [TOPIC], draft a comprehensive abstract (250 words max) that:

1. Introduces the topic and its importance
2. States the specific focus and purpose of the review
3. Briefly describes the review methodology (sources, inclusion criteria)
4. Summarizes key findings organized by main themes
5. Highlights significant gaps or contradictions identified
6. Concludes with implications and future research directions
7. Follows conventions for academic abstracts in [YOUR FIELD]

Write this in a formal, concise style suitable for academic publication.', 'Output Generation', ARRAY['abstract', 'summary', 'publication'], 'Intermediate', '20-25 minutes'),

('Visual Element Description', 'Create detailed descriptions for visual elements to enhance your literature review presentation.', 'Based on my literature review on [TOPIC], describe how to create these visual elements:

1. A conceptual map showing relationships between key theories and concepts
2. A chronological timeline of major developments in this research area
3. A methodological comparison table categorizing studies by approach
4. A gap analysis visualization highlighting research opportunities
5. A thematic network showing connections between major themes

For each visual, provide:
- Key elements to include
- Suggested structure and organization
- Data to be represented
- Design considerations
- How it will enhance understanding of the literature
- A detailed description I can use to create it', 'Output Generation', ARRAY['visuals', 'diagrams', 'presentation'], 'Intermediate', '30-40 minutes'),

-- Insert Refinement Prompts
('Quality and Consistency Check', 'Review and improve the quality and consistency of your literature review draft.', 'Review my draft literature review on [TOPIC] for quality and consistency:
[PASTE YOUR DRAFT]

Evaluate:
1. Logical flow and organization of ideas
2. Consistency in terminology and concepts throughout
3. Balance in coverage across themes and perspectives
4. Integration of critical analysis (not just summarizing papers)
5. Appropriate use of citations and evidence
6. Clarity and academic tone of writing
7. Strengths of the current draft
8. Specific areas for improvement

Provide detailed feedback I can use to refine my literature review.', 'Refinement', ARRAY['quality-check', 'consistency', 'review'], 'Advanced', '35-45 minutes'),

('Theoretical Depth Enhancement', 'Enhance the theoretical depth and sophistication of your literature review.', 'Enhance the theoretical depth of my literature review on [TOPIC]:
[PASTE SECTION OR FULL REVIEW]

Specifically:
1. Identify areas where theoretical discussion could be strengthened
2. Suggest additional theoretical perspectives worth considering
3. Recommend ways to better connect empirical findings to theory
4. Provide language to more clearly articulate theoretical frameworks
5. Suggest how I might better position my research within theoretical debates
6. Recommend theoretical synthesis opportunities I may have missed

Provide specific recommendations with example language I might use.', 'Refinement', ARRAY['theory', 'depth', 'enhancement'], 'Advanced', '40-50 minutes'),

('Citation and Evidence Check', 'Review and strengthen the evidence base and citation practices in your literature review.', 'Review the use of citations and evidence in my literature review:
[PASTE YOUR DRAFT]

Assess:
1. Areas that need additional citation support
2. Places where evidence presented doesn''t fully support claims made
3. Sections relying too heavily on a single source
4. Opportunities to integrate additional perspectives
5. Balance between seminal works and current research
6. Use of primary vs secondary sources
7. Potential citation patterns that could suggest bias

Provide specific suggestions for strengthening the evidence base of my review.', 'Refinement', ARRAY['citations', 'evidence', 'sources'], 'Advanced', '30-40 minutes');

SELECT '✅ Literature Review AI prompts added successfully!' as message;