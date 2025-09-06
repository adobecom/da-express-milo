import {
  ACTION_TYPES,
  useFormData,
  useFormDispatch,
} from '../../../utils/form-hooks';
import { useRef, useEffect } from 'react';
import Label from '../Label';

function Row({ topicsGroup, rowIndex, expandButton, inputRefSetter }) {
  const formDispatch = useFormDispatch();
  return (
    <Label>
      {rowIndex === 0 ? 'Topics:' : 'AND Topics:'}
      {topicsGroup.map((topic, colIndex) => (
        <input
          ref={(el) => inputRefSetter && inputRefSetter(el, rowIndex, colIndex)}
          className="topics-input"
          key={colIndex}
          name={`topic-group-${rowIndex}-${colIndex}`}
          type="text"
          value={topic}
          onChange={(e) =>
            formDispatch({
              type: ACTION_TYPES.TOPICS_UPDATE,
              payload: {
                topicsRow: rowIndex,
                topicsCol: colIndex,
                value: e.target.value,
              },
            })
          }
        />
      ))}
      <div className="flex gap-1">
        {(rowIndex === 0 && topicsGroup.length === 1) || <button
          onClick={(e) => {
            e.preventDefault();
            formDispatch({
              type: ACTION_TYPES.TOPICS_REMOVE,
              payload: {
                topicsRow: rowIndex,
              },
            });
          }}
        >
          -
        </button>}
        {topicsGroup.every(Boolean) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              formDispatch({
                type: ACTION_TYPES.TOPICS_ADD,
                payload: { topicsRow: rowIndex },
              });
            }}
          >
            +
          </button>
        )}
        {expandButton}
      </div>
    </Label>
  );
}

export default function TopicsGroups() {
  const formData = useFormData();
  const formDispatch = useFormDispatch();
  const topics = formData.topics;
  
  // 2D ref structure to store all input references
  const inputRefs = useRef([]);
  
  // Track previous state to detect changes
  const prevTopicsLength = useRef(topics.length);
  const prevRowLengths = useRef(topics.map(row => row.length));
  
  // Auto-focus logic
  useEffect(() => {
    // Check if a new row was added (vertical expansion)
    if (topics.length > prevTopicsLength.current) {
      const newRowIndex = topics.length - 1;
      // Focus on first input of the new row
      if (inputRefs.current[newRowIndex] && inputRefs.current[newRowIndex][0]) {
        inputRefs.current[newRowIndex][0].focus();
      }
    } else {
      // Check if any existing row had a new input added (horizontal expansion)
      for (let rowIndex = 0; rowIndex < topics.length; rowIndex++) {
        const currentRowLength = topics[rowIndex].length;
        const prevRowLength = prevRowLengths.current[rowIndex] || 0;
        
        if (currentRowLength > prevRowLength) {
          // Focus on the last input of this row (newly added)
          const lastColIndex = currentRowLength - 1;
          if (inputRefs.current[rowIndex] && inputRefs.current[rowIndex][lastColIndex]) {
            inputRefs.current[rowIndex][lastColIndex].focus();
          }
          break; // Only one row should have changed at a time
        }
      }
    }
    
    // Update previous state
    prevTopicsLength.current = topics.length;
    prevRowLengths.current = topics.map(row => row.length);
  }, [topics]);
  
  // Function to set input refs in the 2D structure
  const setInputRef = (element, rowIndex, colIndex) => {
    if (!inputRefs.current[rowIndex]) {
      inputRefs.current[rowIndex] = [];
    }
    inputRefs.current[rowIndex][colIndex] = element;
  };
  
  const expandButton = (
    <button
      onClick={(e) => {
        e.preventDefault();
        formDispatch({
          type: ACTION_TYPES.TOPICS_EXPAND,
        });
      }}
    >
      AND
    </button>
  );
  
  return (
    <div className="flex flex-col items-start">
      {topics.map((_, i) => (
        <Row
          key={i}
          rowIndex={i}
          topicsGroup={topics[i]}
          expandButton={i === topics.length - 1 ? expandButton : null}
          inputRefSetter={setInputRef}
        />
      ))}
    </div>
  );
}
