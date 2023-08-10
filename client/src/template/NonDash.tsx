import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import isElectron from 'is-electron';

function NonDash(props: any) {
    return (
        <>
            <div className="auth-fluid" style={{background: "url(shibaspace2.png) center", backgroundSize:"cover"}}>

                <div className="auth-fluid-form-box">
                    <div className="align-items-center d-flex h-100">
                        <Card.Body>

                            <div className="auth-brand text-center text-lg-start">
                                <Link to="/" className="logo-dark">
                                    <span>
                                        <img src={ isElectron() ? "logo-big-dark.png" : "/logo-big-dark.png"} alt="" height="32" />
                                    </span>
                                </Link>
                            </div>

                            {props.children}

                        </Card.Body>
                    </div>
                </div>

                <div className="auth-fluid-right text-center">
                    <div className="auth-user-testimonial">
                        <p className="lead">
                            <i className="mdi mdi-format-quote-open"></i>
                                Buying the dip
                            <i className="mdi mdi-format-quote-close"></i>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NonDash;