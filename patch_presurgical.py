import re

with open('/Users/kunalyadav/Documents/Projects/EndoBone(SIH)/client/src/components/views/PreSurgicalSummary/PreSurgicalSummaryView.jsx', 'r') as f:
    content = f.read()

# Add selectedProcedure state
content = content.replace(
    "const { biomarkers: contextBiomarkers, roiNotes, assessment, persistedAssessment } = usePatientContext();",
    "const { biomarkers: contextBiomarkers, roiNotes, assessment, persistedAssessment } = usePatientContext();\n  const [selectedProcedure, setSelectedProcedure] = useState(patient?.procedure || assessment?.procedure || 'Total Hip Arthroplasty (THA)');"
)

# Replace effectivePlan
new_effective_plan = """  // ── Compute effective surgical plan (backend → fallback to dynamic) ──
  const effectivePlan = useMemo(() => {
    if (plan && plan.overview) return plan;
    const proc = selectedProcedure;
    const risk = assessment?.overallQualityRisk ?? 52;
    const isHighRisk = risk >= 65;
    const isModerateRisk = risk >= 40;

    let hardwareGroups = [];
    if (proc === 'Distal Femur Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Primary Fixation',
          type: 'radio',
          groupId: 'df_primary',
          items: [
            { id: 'df1', name: 'Distal Femoral Locking Plate' },
            { id: 'df2', name: 'Retrograde Intramedullary Nail' }
          ]
        },
        {
          title: 'Additional Fixation',
          type: 'checkbox',
          items: [
            { id: 'df3', name: 'Locking Screws' },
            { id: 'df4', name: 'Cortical Screws' },
            { id: 'df5', name: 'Lag Screw' },
            { id: 'df6', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Proximal Femur Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'pf1', name: 'Cephalomedullary Nail' },
            { id: 'pf2', name: 'Dynamic Hip Screw (DHS)' },
            { id: 'pf3', name: 'Proximal Femoral Locking Plate' },
            { id: 'pf4', name: 'Lag Screw / Helical Blade' },
            { id: 'pf5', name: 'Distal Locking Screws' },
            { id: 'pf6', name: 'Cerclage Cable/Wire' },
            { id: 'pf7', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Femoral Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Fixation Strategy',
          type: 'radio',
          groupId: 'ff_strategy',
          items: [
            { id: 'ff1', name: 'Intramedullary Nail' },
            { id: 'ff2', name: 'Plate & Screw Fixation' },
            { id: 'ff3', name: 'Combined Fixation' }
          ]
        },
        {
          title: 'Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'ff4', name: 'Intramedullary Femoral Nail' },
            { id: 'ff5', name: 'Locking Plate' },
            { id: 'ff6', name: 'Cortical/Locking Screws' },
            { id: 'ff7', name: 'Lag Screw' },
            { id: 'ff8', name: 'Cerclage Cable/Wire' },
            { id: 'ff9', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Total Hip Arthroplasty (THA)' || proc.includes('Hip')) {
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'th1', name: 'Standard Primary Femoral Stem', selected: true },
            { id: 'th2', name: 'Acetabular Cup/Shell', selected: true },
            { id: 'th3', name: 'Acetabular Fixation Screws', selected: isHighRisk },
            { id: 'th4', name: 'Femoral Head', selected: true },
            { id: 'th5', name: 'Acetabular Liner', selected: true },
            { id: 'th6', name: 'Bone Void Filler/Augment', selected: isHighRisk },
            { id: 'th7', name: 'Bone Cement (if applicable)', selected: false }
          ]
        }
      ];
    } else if (proc === 'Total Knee Arthroplasty (TKA)' || proc.includes('Knee')) {
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'tk1', name: 'Femoral Component', selected: true },
            { id: 'tk2', name: 'Tibial Baseplate', selected: true },
            { id: 'tk3', name: 'Tibial Insert', selected: true },
            { id: 'tk4', name: 'Patellar Component', selected: true },
            { id: 'tk5', name: 'Stem/Augment', selected: isModerateRisk || isHighRisk }
          ]
        }
      ];
    } else {
      // Fallback
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'gen1', name: 'Standard Primary Implant' },
            { id: 'gen2', name: 'Fixation Screws' }
          ]
        }
      ];
    }

    return {
      procedure: proc,
      scheduledDate: patient?.scheduledDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      overview: {
        tag: proc.includes('Hip') || proc === 'Proximal Femur Fracture Fixation' ? 'Proximal Femur / Hip' : proc.includes('Knee') || proc === 'Distal Femur Fracture Fixation' ? 'Distal Femur / Knee' : 'Femoral Shaft / Segment',
        approach: proc.includes('Hip') ? 'Direct Anterior / Posterolateral' : proc.includes('Knee') ? 'Medial Parapatellar' : 'Anterolateral / Closed Reduction',
        levels: proc.includes('Hip') || proc === 'Proximal Femur Fracture Fixation' ? 'Femoral Neck & Acetabulum' : proc.includes('Knee') || proc === 'Distal Femur Fracture Fixation' ? 'Distal Femur & Proximal Tibia' : 'Subtrochanteric / Diaphyseal',
        considerations: isHighRisk ? [
          'Elevated bone turnover: Consider augmented fixation purchase.',
          'Pre-operative Vitamin D3 and Calcium optimization recommended.',
          'High structural vulnerability: Minimize excessive reaming.',
          'Plan post-op protected weight bearing timeline.',
        ] : isModerateRisk ? [
          'Moderate metabolic risk: Monitor bone-implant interface post-op.',
          'Standard primary fixation; augmentation contingency available.',
          'Routine intra-operative torque surveillance.',
        ] : [
          'Bone stock verified suitable for primary implant fixation.',
          'Standard instrumentation and loading timeline indicated.',
          'Routine intra-operative torque surveillance.',
        ],
      },
      hardwareGroups,
    };
  }, [plan, patient, assessment, selectedProcedure]);"""

content = re.sub(r"  // ── Compute effective surgical plan.*?hardwareChecklist: hardwareList,\n    };\n  }, \[plan, patient, assessment\]\);", new_effective_plan, content, flags=re.DOTALL)

# Replace hardware selection logic
# Find: const toggleHardwareItem = (id, currentVal) => { ... }
hardware_toggle_new = """  const toggleHardwareItem = (id, currentVal, groupType, groupId, items) => {
    if (isFinalized) return;
    if (groupType === 'radio') {
      // Turn off other items in the radio group
      items.forEach(item => {
        if (item.id !== id) updateHardwareSelection(item.id, false);
      });
      updateHardwareSelection(id, true);
    } else {
      updateHardwareSelection(id, !currentVal);
    }
  };"""
content = re.sub(r"  const toggleHardwareItem = \(id, currentVal\) => \{\n    if \(isFinalized\) return;\n    updateHardwareSelection\(id, !currentVal\);\n  \};", hardware_toggle_new, content)

# Calculate selected items count - Need to update because we don't have a flat hardwareChecklist anymore
# Find: const selectedHardwareCount = hardwareChecklist.filter(item => isItemSelected(item.id, item.selected)).length;
selected_count_new = """  const selectedHardwareCount = hardwareGroups.reduce((total, group) => {
    return total + group.items.filter(item => isItemSelected(item.id, item.selected)).length;
  }, 0);
  const totalHardwareCount = hardwareGroups.reduce((total, group) => total + group.items.length, 0);"""
content = re.sub(r"  const selectedHardwareCount = hardwareChecklist\.filter\(item => isItemSelected\(item\.id, item\.selected\)\)\.length;", selected_count_new, content)

# Fix destructuring
content = content.replace("hardwareChecklist = [],", "hardwareGroups = [],")

# Replace render block for Hardware Checklist
render_block_new = """              {/* Specific Implant & Fixation Plan */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h4 className="text-base font-extrabold text-slate-900">Specific Implant & Fixation Plan</h4>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 shrink-0">
                    {selectedHardwareCount}/{totalHardwareCount} selected
                  </span>
                </div>
                
                {/* Procedure Selection */}
                <div className="mb-6">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Procedure Plan</label>
                  <select 
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                    disabled={isFinalized}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="Total Hip Arthroplasty (THA)">Total Hip Arthroplasty (THA)</option>
                    <option value="Total Knee Arthroplasty (TKA)">Total Knee Arthroplasty (TKA)</option>
                    <option value="Distal Femur Fracture Fixation">Distal Femur Fracture Fixation</option>
                    <option value="Proximal Femur Fracture Fixation">Proximal Femur Fracture Fixation</option>
                    <option value="Femoral Fracture Fixation">Femoral Fracture Fixation</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {hardwareGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3">
                      <h5 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{group.title}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const checked = isItemSelected(item.id, item.selected);
                          const disabled = isFinalized;
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                                checked
                                  ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              <input
                                type={group.type === 'radio' ? 'radio' : 'checkbox'}
                                name={group.type === 'radio' ? group.groupId : item.id}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleHardwareItem(item.id, checked, group.type, group.groupId, group.items)}
                                className={`w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 ${group.type === 'radio' ? 'rounded-full' : 'rounded'}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold truncate ${checked ? 'text-blue-800' : 'text-slate-900'}`}>
                                  {item.name}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {isFinalized && (
                  <p className="text-[10px] text-slate-400 mt-4 italic flex items-center gap-1">
                    <Lock size={10} /> Plan finalized & locked
                  </p>
                )}
              </div>"""

content = re.sub(r"              \{\/\* Surgical Hardware Checklist \*\/.*?<\/div>\n                \{\/isFinalized && \(\n                  <p className=\"text-\[10px\] text-slate-400 mt-3 italic flex items-center gap-1\">\n                    <Lock size=\{10\} \/> Hardware locked — plan finalized\n                  <\/p>\n                \)\}\n              <\/div>", render_block_new, content, flags=re.DOTALL)

with open('/Users/kunalyadav/Documents/Projects/EndoBone(SIH)/client/src/components/views/PreSurgicalSummary/PreSurgicalSummaryView.jsx', 'w') as f:
    f.write(content)
