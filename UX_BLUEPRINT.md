# NexusQMS UI/UX Blueprint — V2

## Product character
NexusQMS should feel like a serious operational quality system, not a generic AI dashboard. The interface should communicate control, traceability, accountability, and calm. AI is a capability inside the product, not the visual identity of the product.

## Design principles
1. **Operational first** — tables, queues, filters, detail panels and action states take priority over decorative cards.
2. **Calm density** — enough information to work efficiently without tiny typography or oversized empty regions.
3. **One visual hierarchy** — page title → section title → operational data → metadata. Avoid excessive all-caps labels.
4. **Restrained status language** — green, amber, red and blue are reserved for semantic states.
5. **Canonical document model visible in UX** — documents, revisions, evidence and relationships are presented as linked governed records, not folder copies.
6. **AI stays contextual** — AI appears where it helps classify, trace or prepare work. It does not dominate the shell.
7. **Auditability by default** — lifecycle, owner, revision, approval state and traceability should remain visible near every governed object.

## Foundation
- Base font: system sans-serif, 14px body
- Small text: 12px
- Page title: 26–28px
- Section title: 15–16px
- Spacing grid: 4 / 8 / 12 / 16 / 24 / 32
- Radius: 6–10px, not highly rounded
- Borders: neutral gray; shadows limited to floating surfaces
- Primary accent: deep teal
- Navigation: neutral light surface with strong active state
- Content width: fluid; avoid artificial centered max-width on operational screens

## Global shell
- Desktop navigation uses a dark-green QMS identity.
- Unpinned desktop navigation is compact (~58px) and expands on hover or keyboard focus.
- A visible pin control appears when expanded; pinned navigation remains open (~228px) until unpinned.
- Hover expansion overlays the workspace rather than pushing content; pinned expansion reserves layout width.
- Mobile navigation remains an off-canvas drawer.
- Global search stays in the top command bar.
- Workspace/tenant switcher stays in the sidebar.
- Primary nav groups: Workspace, Quality assurance, Administration.
- Profile and notifications remain compact; do not use floating numeric notification bubbles.
- No oversized branding, gradients or decorative glass effects.

## Core page patterns

### Overview
Purpose: operational triage.
- compact system health strip
- approval/review work queue
- upcoming controlled reviews
- recent controlled activity
- document-control status summary
- no large decorative chart unless it supports a decision

### Documents
Purpose: find, inspect and control documents.
- left: structure/filter tree
- center: real document table/list with title, revision, type, owner, status and review date
- right: selected document inspector
- inspector tabs: Summary, Revisions, Relationships, Workflow, Audit
- selected row state must be obvious
- avoid wrapping folder counts beneath labels

### Documents in Review
Purpose: complete governed review, approval and publication actions.
- queue on left; selected document detail on right
- default desktop split is 50:50
- divider is keyboard and pointer resizable; the chosen ratio may persist for the browser session
- clicking a queue row selects it and updates the detail pane only
- opening the controlled document is always an explicit **Open document** action
- decision area is anchored at the bottom
- change reason and route history remain visible
- final approver action is **Publish**, not Approve

### Register
Purpose: authoritative canonical register.
- filter bar
- dense table
- sortable-looking headers
- export action
- clicking a document opens Documents view

### Sources & Evidence
Purpose: manage canonical resources and relationships.
- default view is a resource register/table
- filters for type, status, linked/unlinked and department
- right inspector shows selected resource metadata and usage
- relationship map is secondary, not the whole page
- revision-pinning rule displayed where relationships are edited

### Document Types
Purpose: configure behavior, not browse decorative cards.
- table columns: Type, Prefix, Numbering, Approval rule, Review cycle, Documents, Status
- selected row opens a settings inspector
- inspector exposes required metadata, control mode and lifecycle behavior

### Structure
Purpose: configure navigation hierarchy.
- hierarchy editor + preview
- presets secondary
- clear statement that structure does not duplicate canonical resources

### QMS AI
Purpose: permission-aware quality assistant.
- normal chat layout
- source citations clearly separated
- action boundaries visible but not visually dominant
- controlled write actions require confirmation

### ISO 9001 Readiness
Purpose: show management how well the QMS is documented, implemented and effective.
- dashboard summary separates documentation coverage, implementation evidence and overall readiness
- dedicated clause assessment for clauses 4–10 with risk-weighted status
- every AI finding shows its reason, evidence checked, confidence and recommended action
- distinguish Documented → Implemented → Effective; a procedure alone is not proof of conformance
- filters expose critical, at-risk and on-track areas without hiding the assessment basis
- generated actions remain drafts until a human reviews owners, dates and evidence requirements
- use “readiness” or “conformance assessment”; never represent an AI score as certification
- standards and editions are versioned so transition and legacy profiles can coexist

### Repository Builder
Purpose: guided migration/onboarding.
- stepper
- file/source inventory
- AI interview
- proposal review
- explicit unresolved-items queue
- commit only after human confirmation

## Interaction standards
- Buttons use verb-first labels: Add document, Create revision, Link resource, Publish revision when acting as the final approver.
- Primary action: one per page/section when possible.
- Secondary actions: neutral outline.
- Table rows have hover and selected states.
- Side inspectors preserve context instead of opening unnecessary pages.
- Toasts acknowledge demo actions.
- Empty states explain the next useful action.
- All controlled status changes must make the resulting lifecycle state explicit.

## V2 implementation priorities
1. Rebuild shell typography, density and navigation.
2. Rebuild Documents as a professional three-pane workspace.
3. Replace Sources & Evidence graph-first layout with register + inspector + optional graph.
4. Replace Document Types cards with configuration table + inspector.
5. Normalize Overview, My Tasks, Register and settings to the same design system.
6. Preserve manual setup and AI repository builder flows.


## Controlled revision workflow rule

- Only one active revision / approval workflow may exist for a document at a time.
- While a document is in draft, review, approval, or returned-for-change state, starting or requesting another revision is blocked.
- A returned decision keeps the same working revision open; it does not create a new revision number.
- The final approver action is **Publish**. Publishing records the final approval, closes the route, and makes that revision effective.
