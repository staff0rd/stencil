import ts from 'typescript';
import * as d from '@declarations';
import { EVENT_FLAGS } from '@utils';

export function updateConstructor(classMembers: ts.ClassElement[], before: ts.Statement[], after: ts.Statement[]) {
  if (before.length + after.length === 0) {
    return;
  }

  const cstrMethodIndex = classMembers.findIndex(m => m.kind === ts.SyntaxKind.Constructor);
  if (cstrMethodIndex >= 0) {
    const cstrMethod = classMembers[cstrMethodIndex] as ts.ConstructorDeclaration;
    classMembers[cstrMethodIndex] = ts.updateConstructor(
      cstrMethod,
      cstrMethod.decorators,
      cstrMethod.modifiers,
      cstrMethod.parameters,
      ts.updateBlock(cstrMethod.body, [
        ...before,
        ...cstrMethod.body.statements,
        ...after
      ])
    );
  } else {
    const cstrMethod = ts.createConstructor(
      undefined,
      undefined,
      undefined,
      ts.createBlock([
        ...before,
        ...after
      ], true)
    );
    classMembers.unshift(cstrMethod);
  }
}

export function getEventStatements(cmpMeta: d.ComponentCompilerMeta) {
  return cmpMeta.events.map(ev => {
    return ts.createStatement(ts.createAssignment(
      ts.createPropertyAccess(
        ts.createThis(),
        ts.createIdentifier(ev.method)
      ),
      ts.createCall(
        ts.createIdentifier('__stencil_createEvent'),
        undefined,
        [
          ts.createThis(),
          ts.createLiteral(ev.name),
          ts.createLiteral(computeFlags(ev))
        ]
      )
    ));
  });
}

function computeFlags(eventMeta: d.ComponentCompilerEvent) {
  let flags = 0;
  if (eventMeta.bubbles) {
    flags |= EVENT_FLAGS.Bubbles;
  }
  if (eventMeta.composed) {
    flags |= EVENT_FLAGS.Composed;
  }
  if (eventMeta.cancelable) {
    flags |= EVENT_FLAGS.Cancellable;
  }
  return flags;
}
