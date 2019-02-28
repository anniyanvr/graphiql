import React from 'react';

import PropTypes from 'prop-types';

import Modal from 'react-modal';
export default class HasuraAnalyser extends React.Component {
  constructor() {
    super();
    Modal.setAppElement('body');
    this.state = {
      analyseData: [],
      activeNode: 0,
    };
  }
  componentDidMount() {
    this.props
      .analyzeFetcher(this.props.analyseQuery.query)
      .then(r => {
        if (r.ok) {
          return r.json();
        }
        return r.text().then(r => {
          return Promise.reject(new Error(r));
        });
      })
      .then(data => {
        this.setState({
          ...this.state,
          analyseData: data,
          activeNode: 0,
        });
      })
      .catch(e => {
        const errorMessage = `Unable to fetch: ${e.message}.`;
        alert(errorMessage);
        this.props.clearAnalyse();
      });
  }
  copyToClip(type, id) {
    let text = '';
    if (this.state.analyseData.length > 0) {
      if (type === 'sql') {
        text = window.sqlFormatter
          ? window.sqlFormatter.format(
              this.state.analyseData[this.state.activeNode].sql,
              { language: 'sql' },
            )
          : this.state.analyseData[this.state.activeNode].sql;
      } else {
        text = this.state.analyseData[this.state.activeNode].plan.join('\n');
      }
    }
    var textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      var tooltip = document.getElementById(id);
      tooltip.innerHTML = 'Copied';
      if (!successful) {
        throw new Error('Copy was unsuccessful');
      }
    } catch (err) {
      alert('Oops, unable to copy - ' + err);
    }
    document.body.removeChild(textArea);
  }
  resetCopy(id) {
    var tooltip = document.getElementById(id);
    tooltip.innerHTML = 'Copy';
  }
  render() {
    const { show, clearAnalyse } = this.props;
    const analysisList = this.state.analyseData.map((analysis, i) => {
      return (
        <li
          className={i === this.state.activeNode ? 'active' : ''}
          key={i}
          data-key={i}
          onClick={this.handleAnalyseNodeChange.bind(this)}>
          <i className="fa fa-table" aria-hidden="true" />
          {analysis.field}
        </li>
      );
    });
    return (
      <Modal
        className="modalWrapper"
        overlayClassName="myOverlayClass"
        isOpen={show && this.state.analyseData.length > 0}>
        <div className="modalHeader">
          <div className="modalTitle">{'Query Analysis'}</div>
          <div className="modalClose">
            <button onClick={clearAnalyse} className="form-control">
              {'x'}
            </button>
          </div>
        </div>
        <div className="modalBody">
          <div className="wd25">
            <div className="topLevelNodesWrapper">
              <div className="title">{'Top level nodes'}</div>
              <ul>{analysisList}</ul>
            </div>
          </div>
          <div className="wd75">
            <div className="analysisWrapper">
              <div className="plansWrapper">
                <div className="plansTitle">{'Generated SQL'}</div>
                <div className="codeBlock">
                  <div className="copyGenerated">
                    <div className="copyTooltip">
                      <span className="tooltiptext" id="copySql">
                        Copy
                      </span>
                      <i
                        className={'fa fa-copy'}
                        onClick={this.copyToClip.bind(this, 'sql', 'copySql')}
                        onMouseLeave={this.resetCopy.bind(this, 'copySql')}
                      />
                    </div>
                  </div>
                  {window.hljs && window.sqlFormatter ? (
                    <pre>
                      <code
                        dangerouslySetInnerHTML={{
                          __html:
                            this.state.activeNode >= 0 &&
                            this.state.analyseData.length > 0 &&
                            window.hljs.highlight(
                              'sql',
                              window.sqlFormatter.format(
                                this.state.analyseData[this.state.activeNode]
                                  .sql,
                                { language: 'sql' },
                              ),
                            ).value,
                        }}
                      />
                    </pre>
                  ) : (
                    <code>
                      {this.state.activeNode >= 0 &&
                      this.state.analyseData.length > 0
                        ? this.state.analyseData[this.state.activeNode].sql
                        : ''}
                    </code>
                  )}
                </div>
              </div>
              <div className="plansWrapper">
                <div className="plansTitle">{'Execution Plan'}</div>
                <div className="codeBlock">
                  <div className="copyGenerated">
                    <div className="copyTooltip">
                      <span className="tooltiptext" id="copyPlan">
                        Copy
                      </span>
                      <i
                        className={'fa fa-copy'}
                        onClick={this.copyToClip.bind(this, 'plan', 'copyPlan')}
                        onMouseLeave={this.resetCopy.bind(this, 'copyPlan')}
                      />
                    </div>
                  </div>
                  {/*
                  <pre>
                    <code>
                      {this.state.activeNode >= 0
                        && this.state.analyseData.length > 0
                        ? this.state.analyseData[
                            this.state.activeNode
                          ].plan.map((k, i) => <div key={ i }>{k}</div> )
                        : ''}
                    </code>
                  </pre>
                  */}
                  <pre>
                    <code>
                      {this.state.activeNode >= 0 &&
                      this.state.analyseData.length > 0
                        ? this.state.analyseData[
                            this.state.activeNode
                          ].plan.join('\n')
                        : ''}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
  /*
  fetchAnalyse() {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };
    options.body = JSON.stringify(this.props.analyseQuery);
    return fetch('http://localhost:8080/v1alpha1/graphql/explain', options);
  }
  */

  handleAnalyseNodeChange(e) {
    let nodeKey = e.target.getAttribute('data-key');
    if (nodeKey) {
      nodeKey = parseInt(nodeKey, 10);
      this.setState({ ...this.state, activeNode: nodeKey });
    }
  }
}

HasuraAnalyser.propTypes = {
  show: PropTypes.bool.isRequired,
  analyseQuery: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  clearAnalyse: PropTypes.func.isRequired,
  analyzeFetcher: PropTypes.func.isRequired,
};
