/*
Copyright (c) 2021-2023 Filigran SAS

This file is part of the OpenCTI Enterprise Edition ("EE") and is
licensed under the OpenCTI Non-Commercial License (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://github.com/OpenCTI-Platform/opencti/blob/master/LICENSE

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*/

import React from 'react';
import { graphql } from 'react-relay';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import { useTheme } from '@mui/styles';
import { useNavigate } from 'react-router-dom-v5-compat';
import Chart from '../charts/Chart';
import { QueryRenderer } from '../../../../relay/environment';
import { useFormatter } from '../../../../components/i18n';
import { horizontalBarsChartOptions } from '../../../../utils/Charts';
import { itemColor } from '../../../../utils/Colors';
import { simpleNumberFormat } from '../../../../utils/Number';
import { defaultValue } from '../../../../utils/Graph';
import useGranted, { SETTINGS } from '../../../../utils/hooks/useGranted';
import useEnterpriseEdition from '../../../../utils/hooks/useEnterpriseEdition';

const useStyles = makeStyles(() => ({
  paper: {
    height: '100%',
    margin: '10px 0 0 0',
    padding: 0,
    borderRadius: 6,
  },
}));

const auditsHorizontalBarsDistributionQuery = graphql`
  query AuditsHorizontalBarsDistributionQuery(
    $field: String!
    $startDate: DateTime
    $endDate: DateTime
    $dateAttribute: String
    $operation: StatsOperation!
    $limit: Int
    $order: String
    $types: [String]
    $filters: FilterGroup
    $search: String
  ) {
    auditsDistribution(
      field: $field
      startDate: $startDate
      endDate: $endDate
      dateAttribute: $dateAttribute
      operation: $operation
      limit: $limit
      order: $order
      types: $types
      filters: $filters
      search: $search
    ) {
      label
      value
      entity {
        ... on BasicObject {
          entity_type
          id
        }
        ... on BasicRelationship {
          entity_type
          id
        }
        ... on AttackPattern {
          name
          description
        }
        ... on Campaign {
          name
          description
        }
        ... on CourseOfAction {
          name
          description
        }
        ... on Individual {
          name
          description
        }
        ... on Organization {
          name
          description
        }
        ... on Sector {
          name
          description
        }
        ... on System {
          name
          description
        }
        ... on Indicator {
          name
          description
        }
        ... on Infrastructure {
          name
          description
        }
        ... on IntrusionSet {
          name
          description
        }
        ... on Position {
          name
          description
        }
        ... on City {
          name
          description
        }
        ... on AdministrativeArea {
          name
          description
        }
        ... on Country {
          name
          description
        }
        ... on Region {
          name
          description
        }
        ... on Malware {
          name
          description
        }
        ... on MalwareAnalysis {
          result_name
        }
        ... on ThreatActor {
          name
          description
        }
        ... on Tool {
          name
          description
        }
        ... on Vulnerability {
          name
          description
        }
        ... on Incident {
          name
          description
        }
        ... on Event {
          name
          description
        }
        ... on Channel {
          name
          description
        }
        ... on Narrative {
          name
          description
        }
        ... on Language {
          name
        }
        ... on DataComponent {
          name
        }
        ... on DataSource {
          name
        }
        ... on Case {
          name
        }
        ... on StixCyberObservable {
          observable_value
        }
        ... on MarkingDefinition {
          definition_type
          definition
        }
        ... on Creator {
          name
        }
        ... on Report {
          name
        }
        ... on Grouping {
          name
        }
        ... on Note {
          attribute_abstract
          content
        }
        ... on Opinion {
          opinion
        }
        ... on Group {
          name
        }
        ... on Workspace {
          name
          type
        }
      }
    }
  }
`;

const AuditsHorizontalBars = ({
  variant = null,
  height,
  startDate = null,
  endDate = null,
  dataSelection,
  parameters = {},
  withExportPopover = false,
  isReadOnly = false,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const { t } = useFormatter();
  const navigate = useNavigate();
  const isGrantedToSettings = useGranted([SETTINGS]);
  const isEnterpriseEdition = useEnterpriseEdition();
  const renderContent = () => {
    if (!isGrantedToSettings || !isEnterpriseEdition) {
      return (
        <div style={{ display: 'table', height: '100%', width: '100%' }}>
          <span
            style={{
              display: 'table-cell',
              verticalAlign: 'middle',
              textAlign: 'center',
            }}
          >
            {!isEnterpriseEdition
              ? t(
                'This feature is only available in OpenCTI Enterprise Edition.',
              )
              : t('You are not authorized to see this data.')}
          </span>
        </div>
      );
    }
    const selection = dataSelection[0];
    return (
      <QueryRenderer
        query={auditsHorizontalBarsDistributionQuery}
        variables={{
          types: ['History', 'Activity'],
          field: selection.attribute,
          operation: 'count',
          startDate,
          endDate,
          dateAttribute:
            selection.date_attribute && selection.date_attribute.length > 0
              ? selection.date_attribute
              : 'timestamp',
          filters: selection.filters,
          limit: selection.number ?? 10,
        }}
        render={({ props }) => {
          if (
            props
            && props.auditsDistribution
            && props.auditsDistribution.length > 0
          ) {
            const data = props.auditsDistribution.map((n) => ({
              x:
                // eslint-disable-next-line no-nested-ternary
                selection.attribute.endsWith('.id')
                || selection.attribute.endsWith('_id')
                || selection.attribute.endsWith('_ids')
                  ? defaultValue(n.entity)
                  : selection.attribute === 'entity_type'
                    ? t(`entity_${n.label}`)
                    : n.label,
              y: n.value,
              fillColor:
                selection.attribute.endsWith('.id')
                || selection.attribute.endsWith('_id')
                || selection.attribute.endsWith('_ids')
                  ? itemColor(n.entity.entity_type)
                  : itemColor(n.label),
            }));
            const chartData = [
              {
                name: selection.label || t('Number of history entries'),
                data,
              },
            ];
            const redirectionUtils = selection.attribute.endsWith('.id')
              || selection.attribute.endsWith('_id')
              || selection.attribute.endsWith('_ids')
              ? props.auditsDistribution.map((n) => ({
                id: n.entity.id,
                entity_type:
                      n.entity.entity_type === 'Workspace'
                        ? n.entity.type
                        : n.entity.entity_type,
              }))
              : null;
            return (
              <Chart
                options={horizontalBarsChartOptions(
                  theme,
                  true,
                  simpleNumberFormat,
                  null,
                  parameters.distributed,
                  navigate,
                  redirectionUtils,
                )}
                series={chartData}
                type="bar"
                width="100%"
                height="100%"
                withExportPopover={withExportPopover}
                isReadOnly={isReadOnly}
              />
            );
          }
          if (props) {
            return (
              <div style={{ display: 'table', height: '100%', width: '100%' }}>
                <span
                  style={{
                    display: 'table-cell',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                  }}
                >
                  {t('No entities of this type has been found.')}
                </span>
              </div>
            );
          }
          return (
            <div style={{ display: 'table', height: '100%', width: '100%' }}>
              <span
                style={{
                  display: 'table-cell',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                }}
              >
                <CircularProgress size={40} thickness={2} />
              </span>
            </div>
          );
        }}
      />
    );
  };
  return (
    <div style={{ height: height || '100%' }}>
      <Typography
        variant="h4"
        gutterBottom={true}
        style={{
          margin: variant !== 'inLine' ? '0 0 10px 0' : '-10px 0 10px -7px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {parameters.title || t('Distribution of history')}
      </Typography>
      {variant === 'inLine' ? (
        renderContent()
      ) : (
        <Paper classes={{ root: classes.paper }} variant="outlined">
          {renderContent()}
        </Paper>
      )}
    </div>
  );
};

export default AuditsHorizontalBars;
