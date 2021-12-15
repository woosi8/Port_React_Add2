import React from 'react';
import { makeStyles } from '@mui/styles';
// import MuiTreeItem from '@material-ui/lab/TreeItem';
import TreeItem from '@mui/lab/TreeItem';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const useStyles = makeStyles(() => ({
  root: {
    [[
      '&:focus > $content $label',
      '&:hover > $content $label',
      '&$selected > $content $label',
      '&$selected > $content $label:hover',
      '&$selected:focus > $content $label'
    ].join(',')]: {
      backgroundColor: 'transparent'
    }
  },
  content: {},
  expanded: {},
  selected: {},
  label: {
    userSelect: 'none'
  }
}));

const AuthorityItem = ({
  items,
  selected,
  onSelect,
  disableMultiParentSelection
}) => {
  const classes = useStyles();
  const tree = React.useMemo(() => flattenTree({ items }), [items]);
  const marksUncheckedRef = React.useRef(
    createMarksUnchecked({ tree, items, selected })
  );
  const activeParentRef = React.useRef('');

  React.useEffect(() => {
    // marksUncheckedRef.current = createMarksUnchecked({ tree, items, selected });
    // console.log('marksUnchecked', marksUncheckedRef.current);
    // console.clear();
    // console.log(JSON.stringify(marksUncheckedRef.current, null, 2));
    // console.log('activeParent', activeParentRef.current);
  }, [items, selected, tree]);

  const handleChange = ({ event, parents = [] }) => {
    const {
      target: { value, checked }
    } = event;
    let newSelect = selected.slice();

    if (checked) {
      newSelect = [...parents, value].reverse().reduce(
        (prev, curr, index) => {
          const node = curr;
          let newSelectSoFar = prev;

          if (index === 0) {
            const childNodes = getTreeNodes({ tree, node });
            const childNodesLength = childNodes.length;

            if (childNodesLength > 0) {
              newSelectSoFar = [
                ...newSelectSoFar.filter(
                  (select) => !childNodes.includes(select)
                )
              ];

              marksUncheckedRef.current = marksUncheckedRef.current.filter(
                (marksUnchecked) =>
                  ![...childNodes, node].includes(marksUnchecked)
              );
            }
          } else {
            // const childNodes = getTreeNodes({ tree, node, depth: 1 });
            const childNodes = getTreeNodes({ tree, node });
            const childNodesLength = childNodes.length;

            if (childNodesLength > 0) {
              const isEveryChildrenExist = childNodes.every((childNode) =>
                newSelectSoFar.includes(childNode)
              );

              if (isEveryChildrenExist) {
                newSelectSoFar = [
                  ...newSelectSoFar.filter(
                    (select) => !childNodes.includes(select)
                  ),
                  node
                ];

                marksUncheckedRef.current = marksUncheckedRef.current.filter(
                  (marksUnchecked) =>
                    ![...childNodes, node].includes(marksUnchecked)
                );
              }
            }
          }

          marksUncheckedRef.current = marksUncheckedRef.current.filter(
            (marksUnchecked) => !newSelectSoFar.includes(marksUnchecked)
          );

          return newSelectSoFar;
        },
        [...newSelect, value]
      );
    } else if (!checked && !newSelect.includes(value)) {
      let toExclude = value;
      newSelect = parents
        .slice()
        .reverse()
        .reduce(
          (prev, curr, index) => {
            const node = curr;
            let newSelectSoFar = prev;
            let childNodes;

            marksUncheckedRef.current = [
              ...new Set([...marksUncheckedRef.current, toExclude])
            ];

            if (index === 0) {
              childNodes = getTreeNodes({ tree, node, depth: 1 });
              console.log(
                toExclude,
                childNodes,
                childNodes.filter((childNode) => childNode !== toExclude)
              );
              newSelectSoFar = [
                ...newSelectSoFar,
                ...childNodes.filter((childNode) => childNode !== toExclude)
              ];
            } else {
              childNodes = getTreeNodes({ tree, node, depth: 1 }).filter(
                (childNode) => childNode !== toExclude
              );
              console.log(
                toExclude,
                childNodes,
                childNodes.filter((childNode) => childNode !== toExclude)
              );
              newSelectSoFar = [
                ...newSelectSoFar.filter(
                  (select) => !childNodes.includes(select)
                ),
                ...childNodes.filter(
                  (childNode) => !marksUncheckedRef.current.includes(childNode)
                )
              ];
            }

            toExclude = curr;

            return newSelectSoFar;
          },
          newSelect.filter((select) => !parents.includes(select))
        );
    } else {
      [...parents, value]
        .slice()
        .reverse()
        .forEach((item) => {
          const node = item;
          const childNodes = getTreeNodes({ tree, node, depth: 1 });

          if (childNodes.length > 0) {
            marksUncheckedRef.current = [
              ...new Set([...marksUncheckedRef.current, ...childNodes])
            ];
          } else {
            marksUncheckedRef.current = [
              ...new Set([...marksUncheckedRef.current, node])
            ];
          }
        });
      newSelect = newSelect.filter((select) => select !== value);
    }

    if (disableMultiParentSelection) {
      if (checked) {
        activeParentRef.current = parents.length > 0 ? parents[0] : value;
      } else {
        const childNodes = getTreeNodes({
          tree,
          node: parents.length > 0 ? parents[0] : value
        });

        if (!childNodes.some((childNode) => newSelect.includes(childNode))) {
          activeParentRef.current = '';
        }
      }
    }

    onSelect(newSelect);
  };

  const renderTreeItem = ({ nodes, parents = [], level = 0 }) => {
    return nodes.map((node) => {
      const { id: value, label, children } = node;
      const checked =
        selected.includes(value) ||
        parents.some((parent) => selected.includes(parent));
      let disabled = activeParentRef.current
        ? !parents.includes(activeParentRef.current)
        : false;

      if (activeParentRef.current === value) {
        disabled = false;
      }

      if (children && children.length > 0) {
        const indeterminate = isIndeterminate({ tree, selected, node: value });
        const treeItemLabel = createTreeItemLabel({
          formControlLabelProps: { label },
          checkboxProps: {
            value,
            checked,
            indeterminate,
            disabled,
            onChange: (event) => {
              handleChange({ event, parents });
            }
          }
        });

        return (
          <TreeItem
            key={value}
            nodeId={value}
            label={treeItemLabel}
            classes={{
              root: classes.root,
              label: classes.label,
              content: classes.content,
              selected: classes.selected
            }}
          >
            {renderTreeItem({
              nodes: children,
              parents: [...parents, value],
              level: level + 1
            })}
          </TreeItem>
        );
      }

      const treeItemLabel = createTreeItemLabel({
        formControlLabelProps: { label },
        checkboxProps: {
          value,
          checked,
          disabled,
          onChange: (event) => {
            handleChange({ event, parents });
          }
        }
      });

      return (
        <TreeItem
          key={value}
          nodeId={value}
          label={treeItemLabel}
          classes={{
            root: classes.root,
            label: classes.label,
            content: classes.content,
            selected: classes.selected
          }}
        />
      );
    });
  };

  return renderTreeItem({ nodes: items });
};

export default AuthorityItem;

function flattenTree({ items, parent = 'root', depth = 0 }) {
  return items.reduce((prev, curr) => {
    Object.assign(prev, { [parent]: [...(prev[parent] || []), curr.id] });

    if (curr.children && curr.children.length > 0) {
      return {
        ...prev,
        ...flattenTree({
          items: curr.children,
          depth: depth + 1,
          parent: curr.id
        })
      };
    }

    return prev;
  }, {});
}

function createMarksUnchecked({ tree, items, selected }) {
  return items.reduce((prev, { id: node }) => {
    return [...prev, node, ...getTreeNodes({ tree, node })];
  }, []);
}

function createTreeItemLabel({
  formControlLabelProps = {},
  checkboxProps = {}
}) {
  return (
    <FormControlLabel
      style={{ width: '100%', marginLeft: 0 }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      control={<Checkbox {...checkboxProps} />}
      {...formControlLabelProps}
    />
  );
}

function getTreeNodes({ tree, node = 'root', depth, currentDepth = 1 }) {
  const branches = tree[node];

  if (!branches) {
    return [];
  }

  return branches.reduce((prev, curr) => {
    let newPrev = [...prev, curr];

    if (tree[curr] && (typeof depth === 'undefined' || depth > currentDepth)) {
      newPrev = [
        ...newPrev,
        ...getTreeNodes({
          tree,
          node: curr,
          depth,
          currentDepth: currentDepth + 1
        })
      ];
    }

    return newPrev;
  }, []);
}

function isIndeterminate({ tree, node: value, selected }) {
  return getTreeNodes({ tree, node: value }).some((node) =>
    selected.includes(node)
  );
}
