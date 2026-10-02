import { useState } from 'react';
import {
  ChevronDown, ChevronRight, CheckSquare, Square,
  Layers, Building2, Check, X
} from 'lucide-react';

/**
 * CheckboxTree - شجرة اختيار المراحل والتخصصات
 * 
 * يُستخدم في صفحة إنشاء المشروع لسكرتيرة التصميم
 * لاختيار الـ Stages والـ Disciplines المطلوبة للمشروع
 */

const STAGE_LABELS = {
  CONCEPT: 'Concept Design',
  DC1: 'DC1 (Design Criteria 1)',
  DC2: 'DC2 (Design Criteria 2)',
  TENDER: 'Tender Documents',
};

const STAGE_COLORS = {
  CONCEPT: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500' },
  DC1: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
  DC2: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
  TENDER: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500' },
};

const DEPARTMENT_LABELS = {
  ARCH: 'Architecture',
  ELEC: 'Electrical',
  MECH: 'Mechanical',
  STRUCT: 'Structural',
};

const CheckboxTree = ({
  disciplines = [],
  selectedItems = [],
  onSelectionChange,
  disabled = false,
}) => {
  const [expandedStages, setExpandedStages] = useState({});

  // ═══════════════════════════════════════════════════════════
  // تجميع الـ Disciplines حسب الـ Stage
  // ═══════════════════════════════════════════════════════════
  const groupedByStage = disciplines.reduce((acc, disc) => {
    if (!acc[disc.stage]) {
      acc[disc.stage] = [];
    }
    acc[disc.stage].push(disc);
    return acc;
  }, {});

  // ترتيب الـ Stages بالترتيب المنطقي
  const stageOrder = ['CONCEPT', 'DC1', 'DC2', 'TENDER'];
  const sortedStages = stageOrder.filter(stage => groupedByStage[stage]?.length > 0);

  // ═══════════════════════════════════════════════════════════
  // دوال مساعدة
  // ═══════════════════════════════════════════════════════════

  const isDisciplineSelected = (disciplineId) => {
    return selectedItems.some(item => item.discipline_item_id === disciplineId);
  };

  const getStageSelectedCount = (stage) => {
    const stageDisciplines = groupedByStage[stage] || [];
    return stageDisciplines.filter(d => isDisciplineSelected(d.id)).length;
  };

  const isStageFullySelected = (stage) => {
    const stageDisciplines = groupedByStage[stage] || [];
    return stageDisciplines.length > 0 && stageDisciplines.every(d => isDisciplineSelected(d.id));
  };

  const isStagePartiallySelected = (stage) => {
    const count = getStageSelectedCount(stage);
    return count > 0 && !isStageFullySelected(stage);
  };

  const isStageExpanded = (stage) => {
    // إذا كان الـ stage مختار جزئياً أو كلياً، يكون مفتوح تلقائياً
    if (getStageSelectedCount(stage) > 0) return true;
    return expandedStages[stage] || false;
  };

  // ═══════════════════════════════════════════════════════════
  // دوال التفاعل
  // ═══════════════════════════════════════════════════════════

  const toggleStageExpansion = (stage) => {
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !isStageExpanded(stage),
    }));
  };

  const toggleDiscipline = (discipline) => {
    if (disabled) return;

    const isSelected = isDisciplineSelected(discipline.id);
    let newSelection;

    if (isSelected) {
      // إلغاء الاختيار
      newSelection = selectedItems.filter(item => item.discipline_item_id !== discipline.id);
    } else {
      // إضافة الاختيار
      newSelection = [
        ...selectedItems,
        { stage: discipline.stage, discipline_item_id: discipline.id }
      ];
    }

    onSelectionChange(newSelection);
  };

  const toggleEntireStage = (stage) => {
    if (disabled) return;

    const stageDisciplines = groupedByStage[stage] || [];
    const fullySelected = isStageFullySelected(stage);

    let newSelection;

    if (fullySelected) {
      // إلغاء اختيار كل الـ disciplines في هذا الـ stage
      const stageIds = stageDisciplines.map(d => d.id);
      newSelection = selectedItems.filter(item => !stageIds.includes(item.discipline_item_id));
    } else {
      // اختيار كل الـ disciplines في هذا الـ stage
      const existingIds = selectedItems.map(item => item.discipline_item_id);
      const newItems = stageDisciplines
        .filter(d => !existingIds.includes(d.id))
        .map(d => ({ stage: d.stage, discipline_item_id: d.id }));
      newSelection = [...selectedItems, ...newItems];
    }

    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    if (disabled) return;
    const allItems = disciplines.map(d => ({
      stage: d.stage,
      discipline_item_id: d.id,
    }));
    onSelectionChange(allItems);
  };

  const clearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  const totalSelected = selectedItems.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Stages & Disciplines
          </h3>
          {totalSelected > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {totalSelected} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stages List */}
      <div className="divide-y divide-gray-100">
        {sortedStages.map((stage) => {
          const stageDisciplines = groupedByStage[stage] || [];
          const colors = STAGE_COLORS[stage] || STAGE_COLORS.CONCEPT;
          const selectedCount = getStageSelectedCount(stage);
          const fullySelected = isStageFullySelected(stage);
          const partiallySelected = isStagePartiallySelected(stage);
          const expanded = isStageExpanded(stage);

          return (
            <div key={stage}>
              {/* Stage Header */}
              <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  fullySelected ? colors.bg : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleStageExpansion(stage)}
              >
                {/* Expand/Collapse Icon */}
                <button
                  type="button"
                  className="p-1 rounded hover:bg-gray-200/50 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStageExpansion(stage);
                  }}
                >
                  {expanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>

                {/* Stage Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEntireStage(stage);
                  }}
                  disabled={disabled}
                  className="flex-shrink-0"
                >
                  {fullySelected ? (
                    <CheckSquare size={20} className={colors.text} />
                  ) : partiallySelected ? (
                    <div className="relative">
                      <Square size={20} className="text-gray-400" />
                      <div className={`absolute inset-1 ${colors.accent} rounded-sm opacity-50`} />
                    </div>
                  ) : (
                    <Square size={20} className="text-gray-300" />
                  )}
                </button>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${fullySelected ? colors.text : 'text-gray-700'}`}>
                    {STAGE_LABELS[stage] || stage}
                  </span>
                </div>

                {/* Count Badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedCount > 0
                    ? `${colors.bg} ${colors.text}`
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectedCount}/{stageDisciplines.length}
                </span>
              </div>

              {/* Disciplines List (Expanded) */}
              {expanded && (
                <div className={`border-l-2 ${colors.border} ml-8 mr-4 mb-2`}>
                  <div className="grid grid-cols-1 gap-1 py-1">
                    {stageDisciplines.map((discipline) => {
                      const isSelected = isDisciplineSelected(discipline.id);

                      return (
                        <label
                          key={discipline.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? `${colors.bg} ${colors.border} border`
                              : 'hover:bg-gray-50 border border-transparent'
                          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDiscipline(discipline)}
                            disabled={disabled}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />

                          {/* Discipline Name */}
                          <span className={`flex-1 text-sm ${
                            isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                          }`}>
                            {discipline.name}
                          </span>

                          {/* Department Badge */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {DEPARTMENT_LABELS[discipline.department] || discipline.department}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedStages.length === 0 && (
        <div className="text-center py-8">
          <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No disciplines available</p>
        </div>
      )}

      {/* Footer Summary */}
      {totalSelected > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {sortedStages.filter(s => getStageSelectedCount(s) > 0).length} stage(s) · {totalSelected} discipline(s) selected
            </span>
            <div className="flex gap-1">
              {sortedStages.map(stage => {
                const count = getStageSelectedCount(stage);
                if (count === 0) return null;
                const colors = STAGE_COLORS[stage];
                return (
                  <span
                    key={stage}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}
                  >
                    <Check size={10} />
                    {stage}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckboxTree;
