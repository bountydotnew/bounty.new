import { randomUUID } from 'node:crypto';
import type { ReactNode } from 'react';
import { ReacordElement } from './element';
import type { ComponentInteraction, ReacordButtonInteraction } from './interaction';
import type {
  ActionRowItemOptions,
  AttachmentFile,
  MessageOptions,
  V2Component,
} from './message';
import { getOrCreateActionRow } from './message';
import { Node } from './node';

type Output =
  | { type: 'component'; data: V2Component }
  | { type: 'actionRowItem'; data: ActionRowItemOptions }
  | { type: 'attachment'; data: AttachmentFile };

interface CreateComponentOptions<Props> {
  output: (props: Props, ctx: { id: string; text: string }) => Output;
  onButton?: (
    props: Props,
    interaction: ComponentInteraction & { type: 'button' },
  ) => void;
}

export function createComponent<Props extends object>(
  options: CreateComponentOptions<Props>,
) {
  class ComponentNode extends Node<Props> {
    private id = randomUUID();

    override get text(): string {
      return this.children.map((c) => c.text).join('');
    }

    protected override modifyMessageOptionsInternal(
      messageOptions: MessageOptions,
    ): void {
      const output = options.output(this.props, {
        id: this.id,
        text: this.text,
      });

      switch (output.type) {
        case 'component': {
          messageOptions.components.push(output.data);
          break;
        }
        case 'actionRowItem': {
          getOrCreateActionRow(messageOptions, output.data).components.push(
            output.data,
          );
          break;
        }
        case 'attachment': {
          if (!messageOptions.files) messageOptions.files = [];
          messageOptions.files.push(output.data);
          break;
        }
      }
    }

    override handleComponentInteraction(
      interaction: ComponentInteraction,
    ): boolean {
      if (this.hidden) {
        return false;
      }
      if (interaction.customId === this.id && interaction.type === 'button' && options.onButton !== undefined) {
        options.onButton(this.props, interaction);
        return true;
      }
      for (const child of this.children) {
        if (child.handleComponentInteraction(interaction)) {
          return true;
        }
      }
      return false;
    }
  }

  return function Component(props: Props & { children?: ReactNode }) {
    return (
      <ReacordElement props={props} createNode={(p) => new ComponentNode(p)}>
        {props.children}
      </ReacordElement>
    );
  };
}
