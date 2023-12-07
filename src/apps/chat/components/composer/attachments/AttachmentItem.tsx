import * as React from 'react';

import { Box, Button, CircularProgress, ColorPaletteProp, Sheet, Typography } from '@mui/joy';
import AbcIcon from '@mui/icons-material/Abc';
import CodeIcon from '@mui/icons-material/Code';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TextureIcon from '@mui/icons-material/Texture';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import { GoodTooltip } from '~/common/components/GoodTooltip';
import { ellipsizeFront, ellipsizeMiddle } from '~/common/util/textUtils';

import type { Attachment, AttachmentConversionType, AttachmentId } from './store-attachments';


// default attachment width
const ATTACHMENT_MIN_STYLE = {
  height: '100%',
  minHeight: '40px',
  minWidth: '64px',
};


const ellipsizeLabel = (label?: string) => {
  if (!label)
    return '';
  return ellipsizeMiddle((label || '').replace(/https?:\/\/(?:www\.)?/, ''), 30).replace('…', '…\n…');
};


/**
 * Displayed while a source is loading
 */
const LoadingIndicator = React.forwardRef((props: { label: string }, _ref) =>
  <Sheet
    color='success' variant='soft'
    sx={{
      border: '1px solid',
      borderColor: 'success.solidBg',
      borderRadius: 'sm',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
      ...ATTACHMENT_MIN_STYLE,
      boxSizing: 'border-box',
      px: 1,
      py: 0.5,
    }}
  >
    <CircularProgress color='success' size='sm' />
    <Typography level='title-sm' sx={{ whiteSpace: 'nowrap' }}>
      {ellipsizeLabel(props.label)}
    </Typography>
  </Sheet>,
);
LoadingIndicator.displayName = 'LoadingIndicator';


const InputErrorIndicator = () =>
  <WarningRoundedIcon sx={{ color: 'danger.solidBg' }} />;


const conversionTypeToIconMap: { [key in AttachmentConversionType]: React.ComponentType<any> } = {
  'text': TextFieldsIcon,
  'rich-text': CodeIcon,
  'rich-text-table': PivotTableChartIcon,
  'pdf-text': PictureAsPdfIcon,
  'pdf-images': PictureAsPdfIcon,
  'image': ImageOutlinedIcon,
  'image-ocr': AbcIcon,
  'unhandled': TextureIcon,
};

function attachmentConversionIcon(attachment: Attachment) {
  const conversion = attachment.conversionIdx !== null ? attachment.conversions[attachment.conversionIdx] ?? null : null;
  if (conversion && conversion.id) {
    const Icon = conversionTypeToIconMap[conversion.id] ?? null;
    if (Icon)
      return <Icon sx={{ width: 24, height: 24 }} />;
  }
  return null;
}


function attachmentLabelText(attachment: Attachment): string {
  return ellipsizeFront(attachment.label, 24);
}


export function AttachmentItem(props: {
  attachment: Attachment,
  menuShown: boolean,
  onClick: (attachmentId: AttachmentId, anchor: HTMLAnchorElement) => void,
}) {

  // derived state
  const { attachment, onClick } = props;

  const isInputLoading = attachment.inputLoading;
  const isInputError = !!attachment.inputError;
  const isUnconverted = attachment.conversions.length === 0;
  const isOutputLoading = attachment.outputsLoading;
  const isOutputExpectedAndMissing = attachment.outputs?.length === 0;


  const handleShowMenu = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    onClick(attachment.id, event.currentTarget);
  }, [attachment, onClick]);


  // compose tooltip
  let tooltip: string | null = '';
  if (attachment.source.media !== 'text')
    tooltip += attachment.source.media + ': ';
  tooltip += attachment.label;
  // if (hasInput)
  //   tooltip += `\n(${aInput.mimeType}: ${aInput.dataSize.toLocaleString()} bytes)`;
  // if (aOutputs && aOutputs.length >= 1)
  //   tooltip += `\n\n${JSON.stringify(aOutputs)}`;

  // choose variants and color
  let variant: 'soft' | 'outlined' | 'contained';
  let color: ColorPaletteProp;
  if (isInputLoading || isOutputLoading) {
    variant = 'soft';
    color = 'success';
  } else if (isInputError) {
    tooltip = `Issue loading the attachment: ${attachment.inputError}\n\n${tooltip}`;
    variant = 'soft';
    color = 'danger';
  } else if (isUnconverted) {
    tooltip = `Attachments of type '${attachment.input?.mimeType}' are not supported yet. You can open a feature request on GitHub.\n\n${tooltip}`;
    variant = 'soft';
    color = 'warning';
  } else if (isOutputExpectedAndMissing) {
    tooltip = 'Not compatible with the selected LLM or not supported. Please select another format.\n\n' + tooltip;
    variant = 'soft';
    color = 'warning';
  } else {
    // all good
    tooltip = null;
    variant = 'outlined';
    color = /*menuAnchor ? 'primary' :*/ 'neutral';
  }


  return <Box>

    <GoodTooltip
      title={tooltip}
      isError={isInputError}
      isWarning={isUnconverted || isOutputExpectedAndMissing}
      sx={{ p: 1, whiteSpace: 'break-spaces' }}
    >
      {isInputLoading
        ? <LoadingIndicator label={attachment.label} />
        : (
          <Button
            size='sm'
            variant={variant} color={color}
            onClick={handleShowMenu}
            sx={{
              backgroundColor: props.menuShown ? `${color}.softActiveBg` : variant === 'outlined' ? 'background.popup' : undefined,
              border: variant === 'soft' ? '1px solid' : undefined,
              borderColor: variant === 'soft' ? `${color}.solidBg` : undefined,
              borderRadius: 'sm',
              fontWeight: 'normal',
              ...ATTACHMENT_MIN_STYLE,
              px: 1, py: 0.5,
              display: 'flex', flexDirection: 'row', gap: 1,
            }}
          >
            {isInputError
              ? <InputErrorIndicator />
              : <>
                {attachmentConversionIcon(attachment)}
                {isOutputLoading
                  ? <>Converting <CircularProgress color='success' size='sm' /></>
                  : <Typography level='title-sm' sx={{ whiteSpace: 'nowrap' }}>
                    {attachmentLabelText(attachment)}
                  </Typography>}
              </>}
          </Button>
        )}
    </GoodTooltip>

  </Box>;
}