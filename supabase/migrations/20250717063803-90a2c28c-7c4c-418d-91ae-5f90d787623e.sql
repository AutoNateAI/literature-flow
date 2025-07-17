-- Create system user for literature review prompts
INSERT INTO auth.users (
  id, 
  email, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data,
  is_sso_user,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@literaturereview.ai',
  now(),
  now(),
  now(),
  '{"display_name": "System", "title": "Literature Review AI"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.profiles (
  user_id,
  display_name, 
  title
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System',
  'Literature Review AI'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert literature review prompts
INSERT INTO public.prompts (title, description, content, category, tags, difficulty_level, estimated_time, user_id) VALUES
-- Setup and Planning
('Research Question Refinement', 'Refine and clarify your research question for focused literature searching', 'Help me refine my research question: [INSERT YOUR RESEARCH QUESTION]. Please suggest ways to make it more specific, focused, and researchable. Consider: 1) Is the scope appropriate? 2) Are the key concepts clearly defined? 3) What are potential sub-questions? 4) How can this question contribute to existing knowledge?', 'Setup and Planning', ARRAY['research question', 'planning', 'focus'], 'Beginner', '15-30 minutes', '00000000-0000-0000-0000-000000000000'),

('Search Strategy Development', 'Create comprehensive search strategies for multiple databases', 'I need to develop a search strategy for my literature review on: [INSERT YOUR TOPIC]. Please help me: 1) Identify key search terms and synonyms, 2) Suggest appropriate databases to search, 3) Create Boolean search strings, 4) Recommend filters (date range, publication type, etc.), 5) Plan for grey literature sources. My research focus is: [INSERT SPECIFIC FOCUS]', 'Setup and Planning', ARRAY['search strategy', 'databases', 'keywords'], 'Intermediate', '30-45 minutes', '00000000-0000-0000-0000-000000000000'),

('Literature Tracking System', 'Design a system to organize and track your literature review progress', 'Help me design a systematic approach to track my literature review progress. I need: 1) A citation management strategy, 2) A system for organizing papers by themes/categories, 3) A method to track inclusion/exclusion decisions, 4) A way to monitor search coverage across databases, 5) Templates for note-taking and analysis. My review focuses on: [INSERT TOPIC]', 'Setup and Planning', ARRAY['organization', 'tracking', 'systematic'], 'Beginner', '20-30 minutes', '00000000-0000-0000-0000-000000000000'),

-- Paper Analysis
('Comprehensive Paper Summary', 'Create detailed summaries of research papers for systematic analysis', 'Please help me create a comprehensive summary of this research paper. Paper details: [INSERT CITATION/TITLE]. Please analyze: 1) Research question/objectives, 2) Methodology and study design, 3) Key findings and results, 4) Limitations and biases, 5) Contribution to the field, 6) Relevance to my research question: [INSERT YOUR RESEARCH QUESTION]', 'Paper Analysis', ARRAY['summary', 'analysis', 'critical reading'], 'Intermediate', '45-60 minutes', '00000000-0000-0000-0000-000000000000'),

('Theoretical Framework Extraction', 'Extract and analyze theoretical frameworks from research papers', 'Help me extract and analyze the theoretical framework from this paper: [INSERT PAPER DETAILS]. Please identify: 1) The main theories or models used, 2) How theories are applied to the research, 3) Relationships between different theoretical concepts, 4) Gaps or limitations in the theoretical approach, 5) How this framework relates to other papers in my review on: [INSERT YOUR TOPIC]', 'Paper Analysis', ARRAY['theory', 'framework', 'conceptual'], 'Advanced', '30-45 minutes', '00000000-0000-0000-0000-000000000000'),

('Methodology Evaluation', 'Critically evaluate research methodologies and their appropriateness', 'Please help me critically evaluate the methodology of this study: [INSERT STUDY DETAILS]. Analyze: 1) Appropriateness of research design for the research question, 2) Sampling strategy and sample size, 3) Data collection methods and instruments, 4) Data analysis techniques, 5) Validity and reliability considerations, 6) Ethical considerations, 7) How this methodology compares to others in the field', 'Paper Analysis', ARRAY['methodology', 'critique', 'evaluation'], 'Advanced', '30-45 minutes', '00000000-0000-0000-0000-000000000000'),

('Results and Findings Extraction', 'Systematically extract and organize key findings from research papers', 'Help me systematically extract key findings from this paper: [INSERT PAPER DETAILS]. Please organize: 1) Main results/findings with statistical details, 2) Secondary findings, 3) Unexpected results, 4) Effect sizes and confidence intervals where applicable, 5) Practical significance vs statistical significance, 6) How findings relate to the research questions, 7) Implications for my research area: [INSERT YOUR FOCUS]', 'Paper Analysis', ARRAY['results', 'findings', 'data extraction'], 'Intermediate', '30-45 minutes', '00000000-0000-0000-0000-000000000000'),

('Critical Evaluation', 'Conduct critical evaluation of research quality and credibility', 'Please help me critically evaluate this research paper: [INSERT PAPER DETAILS]. Assess: 1) Study quality and rigor, 2) Potential biases and limitations, 3) Generalizability of findings, 4) Clarity and logic of arguments, 5) Use of appropriate citations, 6) Contribution to knowledge, 7) Overall credibility and trustworthiness, 8) How this paper strengthens or challenges current understanding in [INSERT FIELD]', 'Paper Analysis', ARRAY['critical thinking', 'evaluation', 'quality assessment'], 'Advanced', '45-60 minutes', '00000000-0000-0000-0000-000000000000'),

-- Batch Processing
('Multi-Paper Theme Identification', 'Identify common themes and patterns across multiple research papers', 'Help me identify themes and patterns across these papers: [LIST PAPER TITLES/AUTHORS]. Please: 1) Identify recurring themes and concepts, 2) Note methodological patterns, 3) Highlight consensus areas, 4) Point out contradictions or debates, 5) Suggest thematic categories for organization, 6) Identify gaps where themes are underexplored. My research focus is: [INSERT RESEARCH QUESTION]', 'Batch Processing', ARRAY['themes', 'patterns', 'synthesis'], 'Intermediate', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Chronological Development Analysis', 'Analyze how research in a field has evolved over time', 'Help me analyze the chronological development of research in my field. Papers span from [DATE RANGE] and focus on [INSERT TOPIC]. Please: 1) Identify key developments and turning points, 2) Show how methodologies have evolved, 3) Track changes in theoretical approaches, 4) Note shifts in research focus, 5) Identify influential papers that shaped the field, 6) Suggest timeline visualization approach', 'Batch Processing', ARRAY['chronological', 'evolution', 'timeline'], 'Advanced', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Methodological Comparison', 'Compare methodologies across multiple studies to identify best practices', 'Help me compare methodologies across these studies on [INSERT TOPIC]: [LIST STUDIES]. Please analyze: 1) Different methodological approaches used, 2) Strengths and weaknesses of each approach, 3) Appropriateness for different research questions, 4) Trends in methodological choices, 5) Gaps in methodological diversity, 6) Recommendations for future research methods in this area', 'Batch Processing', ARRAY['methodology', 'comparison', 'best practices'], 'Advanced', '45-75 minutes', '00000000-0000-0000-0000-000000000000'),

('Contradictory Findings Analysis', 'Analyze and reconcile contradictory findings across studies', 'Help me analyze contradictory findings in my literature review on [INSERT TOPIC]. Conflicting studies include: [LIST CONFLICTING STUDIES]. Please: 1) Identify specific areas of contradiction, 2) Analyze potential reasons for differences (methodology, sample, context), 3) Assess the quality of evidence on each side, 4) Suggest possible reconciliation or explanation, 5) Identify what additional research is needed to resolve conflicts', 'Batch Processing', ARRAY['contradictions', 'conflicts', 'reconciliation'], 'Advanced', '45-75 minutes', '00000000-0000-0000-0000-000000000000'),

-- Synthesis
('Literature Synthesis', 'Synthesize findings across multiple studies to identify patterns and insights', 'Help me synthesize findings from my literature review on [INSERT TOPIC]. Key papers include: [LIST MAIN PAPERS]. Please: 1) Integrate findings to identify overarching patterns, 2) Synthesize theoretical contributions, 3) Combine methodological insights, 4) Identify areas of strong consensus, 5) Highlight remaining uncertainties, 6) Suggest implications for theory and practice, 7) Propose directions for future research', 'Synthesis', ARRAY['synthesis', 'integration', 'patterns'], 'Advanced', '90-120 minutes', '00000000-0000-0000-0000-000000000000'),

('Conceptual Framework Development', 'Develop new conceptual frameworks based on literature review findings', 'Based on my literature review on [INSERT TOPIC], help me develop a conceptual framework. Key concepts identified include: [LIST KEY CONCEPTS]. Please: 1) Organize concepts into logical relationships, 2) Identify core variables and their connections, 3) Suggest causal pathways or processes, 4) Incorporate existing theories where appropriate, 5) Identify testable propositions, 6) Consider practical applications', 'Synthesis', ARRAY['conceptual framework', 'theory building', 'model'], 'Advanced', '90-120 minutes', '00000000-0000-0000-0000-000000000000'),

('Research Gap Analysis', 'Identify and articulate gaps in the current literature', 'Help me conduct a comprehensive gap analysis for my literature review on [INSERT TOPIC]. Please identify: 1) Methodological gaps (understudied methods, populations), 2) Theoretical gaps (unexplored relationships, mechanisms), 3) Empirical gaps (conflicting findings, limited evidence), 4) Practical gaps (real-world applications), 5) Geographic or cultural gaps, 6) Temporal gaps, 7) How each gap represents an opportunity for future research', 'Synthesis', ARRAY['gaps', 'future research', 'opportunities'], 'Intermediate', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Interdisciplinary Connections', 'Identify connections and insights from related disciplines', 'Help me explore interdisciplinary connections for my literature review on [INSERT TOPIC]. Please: 1) Identify relevant related disciplines, 2) Find concepts/theories from other fields that apply, 3) Suggest how insights from other disciplines could inform my topic, 4) Identify potential collaboration opportunities, 5) Highlight innovative interdisciplinary approaches, 6) Suggest ways to bridge disciplinary divides in future research', 'Synthesis', ARRAY['interdisciplinary', 'connections', 'innovation'], 'Advanced', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

-- Output Generation (continued from previous insert)
('Literature Review Introduction', 'Write compelling introductions for literature review sections', 'Help me write a strong introduction for my literature review on [INSERT TOPIC]. Please include: 1) Context and background of the research area, 2) Importance and relevance of the topic, 3) Scope and boundaries of the review, 4) Research questions or objectives, 5) Organization and structure preview, 6) Key terms and definitions, 7) Brief overview of main findings/arguments. Target audience: [INSERT AUDIENCE]', 'Output Generation', ARRAY['introduction', 'writing', 'structure'], 'Intermediate', '45-75 minutes', '00000000-0000-0000-0000-000000000000'),

('Methods Section Writing', 'Create detailed methods sections for literature reviews', 'Help me write a comprehensive methods section for my literature review. Please include: 1) Search strategy and databases used, 2) Inclusion and exclusion criteria, 3) Selection process and screening procedures, 4) Data extraction methods, 5) Quality assessment approach, 6) Analysis and synthesis methods, 7) Limitations and potential biases. My review covers: [INSERT TOPIC AND SCOPE]', 'Output Generation', ARRAY['methods', 'systematic', 'transparency'], 'Advanced', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Conclusion and Implications', 'Write impactful conclusions that highlight key insights and implications', 'Help me write a strong conclusion for my literature review on [INSERT TOPIC]. Please include: 1) Summary of key findings and patterns, 2) Theoretical contributions and implications, 3) Practical implications for [INSERT FIELD/PRACTICE], 4) Methodological insights and recommendations, 5) Limitations of the current literature, 6) Clear directions for future research, 7) Final thoughts on significance and impact', 'Output Generation', ARRAY['conclusion', 'implications', 'impact'], 'Intermediate', '45-75 minutes', '00000000-0000-0000-0000-000000000000'),

('Abstract Writing', 'Create compelling abstracts that capture the essence of your literature review', 'Help me write an effective abstract for my literature review on [INSERT TOPIC]. The abstract should include: 1) Purpose and scope of the review, 2) Methods used for literature search and analysis, 3) Key findings and main themes identified, 4) Theoretical and practical implications, 5) Conclusions and future research directions. Word limit: [INSERT LIMIT]. Target journal/audience: [INSERT TARGET]', 'Output Generation', ARRAY['abstract', 'summary', 'concise writing'], 'Intermediate', '30-45 minutes', '00000000-0000-0000-0000-000000000000'),

('Visual Elements Description', 'Create descriptions for tables, figures, and visual elements', 'Help me create effective visual elements for my literature review on [INSERT TOPIC]. I need: 1) Description for a summary table of key studies, 2) Caption for a figure showing [INSERT FIGURE TYPE], 3) Design for a conceptual model diagram, 4) Format for a timeline or chronological chart, 5) Layout for a comparison matrix. Please provide detailed descriptions and formatting guidance for each visual element.', 'Output Generation', ARRAY['visuals', 'tables', 'figures'], 'Intermediate', '45-60 minutes', '00000000-0000-0000-0000-000000000000'),

-- Refinement
('Quality and Consistency Check', 'Review literature review for quality, consistency, and completeness', 'Please help me conduct a quality check of my literature review draft on [INSERT TOPIC]. Review for: 1) Consistency in terminology and definitions, 2) Logical flow and organization, 3) Balance in coverage of different perspectives, 4) Adequacy of evidence for claims, 5) Clarity of arguments and transitions, 6) Completeness of coverage, 7) Professional tone and style, 8) Proper citation and referencing', 'Refinement', ARRAY['quality check', 'consistency', 'review'], 'Advanced', '60-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Theoretical Depth Enhancement', 'Deepen theoretical analysis and strengthen conceptual contributions', 'Help me enhance the theoretical depth of my literature review on [INSERT TOPIC]. Please suggest: 1) Ways to strengthen theoretical analysis, 2) Additional theoretical perspectives to consider, 3) Deeper exploration of conceptual relationships, 4) Integration of competing theoretical viewpoints, 5) Clarification of theoretical contributions, 6) Connections to broader theoretical frameworks, 7) Areas where theoretical development could be enhanced', 'Refinement', ARRAY['theory', 'depth', 'enhancement'], 'Advanced', '75-90 minutes', '00000000-0000-0000-0000-000000000000'),

('Citation and Evidence Review', 'Strengthen citations and ensure robust evidence base', 'Help me review and strengthen the citations and evidence in my literature review on [INSERT TOPIC]. Please check: 1) Adequacy of evidence for key claims, 2) Balance between seminal and recent sources, 3) Diversity of perspectives and authors, 4) Proper use of primary vs secondary sources, 5) Citation accuracy and completeness, 6) Areas needing additional evidence, 7) Potential bias in source selection, 8) Overall credibility of evidence base', 'Refinement', ARRAY['citations', 'evidence', 'credibility'], 'Advanced', '60-90 minutes', '00000000-0000-0000-0000-000000000000');