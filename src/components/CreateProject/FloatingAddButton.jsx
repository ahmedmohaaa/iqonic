import { useState } from 'react';
import { Plus, Layers } from 'lucide-react';

/**
 * FloatingAddButton - زر عائم لإضافة المراحل والتخصصات
 * 
 * يظهر فقط لسكرتيرة التصميم في صفحة إنشاء المشروع.
 * عند الضغط عليه يفتح الـ StageDisciplineModal.
 */

const FloatingAddButton = ({
  onClick,
  selectedCount = 0,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* ═══════════════════════════════════════════════════════════
          ✅ تم حذف شارة الرقم (Count Badge) نهائياً من هنا
          ═══════════════════════════════════════════════════════════ */}

      {/* الزر الرئيسي */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        disabled={disabled}
        aria-label="Add Stages and Disciplines"
        title="Add Stages and Disciplines"
        className={`
          relative
          flex items-center justify-center
          w-14 h-14
          rounded-full
          shadow-lg
          transition-all duration-300
          focus:outline-none focus:ring-4 focus:ring-blue-300
          ${disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl cursor-pointer'
          }
          ${isPressed && !disabled ? 'scale-90' : isHovered && !disabled ? 'scale-105' : 'scale-100'}
        `}
      >
        {/* أيقونة + */}
        <Plus
          size={24}
          strokeWidth={2.5}
          className={`
            text-white
            transition-transform duration-300
            ${isHovered && !disabled ? 'rotate-90' : 'rotate-0'}
          `}
        />

        {/* تأثير النبض عند الـ hover */}
        {isHovered && !disabled && (
          <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" />
        )}
      </button>

      {/* Tooltip عند الـ hover */}
      {isHovered && !disabled && (
        <div
          className={`
            absolute bottom-full right-0 mb-2
            px-3 py-1.5
            bg-gray-900 text-white text-xs font-medium
            rounded-lg shadow-lg
            whitespace-nowrap
            transition-all duration-200
            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
          `}
        >
          Add Stages & Disciplines
          <div className="absolute top-full right-5 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1" />
        </div>
      )}

      {/* ملخص الاختيارات عند وجودها */}
      {selectedCount > 0 && !isHovered && (
        <div
          className={`
            absolute top-full right-0 mt-2
            px-3 py-1.5
            bg-white border border-blue-200 text-blue-700 text-xs font-medium
            rounded-lg shadow-md
            whitespace-nowrap
            flex items-center gap-1.5
          `}
        >
          <Layers size={12} className="text-blue-600" />
          {selectedCount} discipline{selectedCount !== 1 ? 's' : ''} configured
        </div>
      )}
    </div>
  );
};

export default FloatingAddButton;
