/* eslint-disable */

/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2023 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
**************************************************************************/

import { isUndefinedOrNull } from '../util.js';
import * as colorwheel from './colorwheel.js';
import { hsvToAllSpacesDenormalized, valuesToAllSpaces } from './ColorConversions.js';

const NUMBER_SWATCHES = 5;

const polarPointCanonicalAngle0To360 = function (deg) {
    const a = deg % 360;

    return a < 0 ? a + 360 : a;
};

const polarPointCanonicalAnglePlusMinus180 = function (deg) {
    const a = deg % 360;

    return a <= -180 ? a + 360 : a > 180 ? a - 360 : a;
};


// Represent p with a positive radius and an angle in the range 0 <= angle < 360
function cylindricalColorToCanonical360(p) {
    const pc = p.copy();

    if (pc.radius() < 0) {
        pc.radius(pc.radius() * -1);
        pc.angle(pc.angle() + 180);
    }

    pc.angle(polarPointCanonicalAngle0To360(pc.angle()));
    return pc;
}


function cylindricalColorEquivalent(p1, p2) {
    const pc1 = p1.canonical360();
    const pc2 = p2.canonical360();

    return pc1.angle() == pc2.angle() && pc1.radius() == pc2.radius() && p1.height() == p2.height();
}


var CylindricalColor = function (p_angle, p_radius, p_height) {
    if (isUndefinedOrNull(p_angle)) {
        p_angle = 0;
    }
    if (isUndefinedOrNull(p_radius)) {
        p_radius = 0;
    }
    if (isUndefinedOrNull(p_height)) {
        p_height = 0.001;
    }

    this.angle = function (a) {
        if (!isUndefinedOrNull(a)) {
            this._angle = polarPointCanonicalAngle0To360(a);
        } else {
            return this._angle;
        }
    };

    this.radius = function (r) {
        if (!isUndefinedOrNull(r)) {
            if (r < 0) {
                // Radius should always be positive
                // A negative radius is equivalent to rotating the angle by 180 degrees and using a positive radius
                this.angle(this.angle() + 180);
                this.radius(r * -1);
            } else if (r > 1.0) {
                this._radius = 1.0;
            } else {
                this._radius = r;
            }
        } else {
            return this._radius;
        }
    };

    this.height = function (h) {
        if (!isUndefinedOrNull(h)) {
            if (h > 1.0) {
                this._height = 1.0;
            } else if (h < 0.001) {
                this._height = 0.001;
            } else {
                this._height = h;
            }
        } else {
            return this._height;
        }
    };

    this.copy = function () {
        return new CylindricalColor(this._angle, this._radius, this._height);
    };

    this.setTo = function (a, r, h) {
        this.radius(r);
        this.height(h);
        this.angle(a);

        return this;
    };

    // Represent this point with a positive radius and an angle in the range 0 <= angle < 360
    this.canonical360 = function () {
        return cylindricalColorToCanonical360(this);
    };

    this.equivalent = function (p) {
        return cylindricalColorEquivalent(this, p);
    };

    // Represent p with a positive radius and an angle in the range 0 <= angle < 360
    this._height = p_height;
    this._angle = p_angle;
    this._radius = p_radius;
    return this;
};


//Inherit Statics from Super
// CylindricalColor.prototype = new CylindricalPoint();
// CylindricalColor.prototype.constructor = CylindricalColor;

const polarColorRegionConstrainToUnitRange = function (input) {
    return Math.min(1.0, Math.max(0, input));
};

const polarColorRegionConstrainToUnitVector = function (input) {
    return Math.min(1.0, Math.max(-1.0, input));
};


const kOverflowClip = 0;
const kOverflowPolar = 1;
const kOverflowWraparound = 2;
const kOverflowNegate = 3;
const kOverflowReflect = 4;
const kOverflowScrunch = 5;

function OverflowResponse(t) {
    let _type;

    this.type = function (t) {
        if (!isUndefinedOrNull(t)) {
            switch (t) {
                case kOverflowClip:
                case kOverflowPolar:
                case kOverflowWraparound:
                case kOverflowNegate:
                case kOverflowReflect:
                case kOverflowScrunch:
                    _type = t;
                    break;

                default:
                    _type = kOverflowClip;
                    break;
            }
            return this;
        }

        return _type;
    };

    this.type(t || kOverflowClip);
}

// Performs DerivedLength when the OverflowResponse is kOverflowScrunch.
// See comments at typedef of OverflowResponse.
// This is a static function
const relativeColorRegionDerivedLengthScrunch = function (baseLength, delta, minDelta, maxDelta) {
    if (delta > 0 && baseLength + maxDelta >= 1.0) {
        if (delta >= maxDelta) {
            // Note that if maxDelta is 0 we will hit this case, since delta > 0.
            // Delta should really never exceed maxDelta unless we aren't maintaining the
            // MaxDelta correctly, but given the number of ways that regions can change,
            // That's a significant risk so it's worth testing for.
            return 1.0;
        }

        return baseLength + delta / maxDelta * (1.0 - baseLength);
    } else if (delta < 0 && baseLength + minDelta <= 0.0) {
        if (delta <= minDelta || minDelta === 0.0) {
            // Note that if minDelta is 0 we will hit this case, since delta < 0.
            return 0.0;
        }

        return baseLength * (1.0 - delta / minDelta);
    }

    return baseLength + delta;
};


// Performs DerivedLength when the _fScheme is null or the OverflowResponse is not kOverflowScrunch.
// See comments at typedef of OverflowResponse.
// This is a static function
const relativeColorRegionDerivedLength = function (baseLength, delta, onOverflow, minThreshold) {
    if (onOverflow.type() == kOverflowScrunch) {
        // We shouldn't get here unless _fScheme is null. Since it has no record of the min and max deltas
        // For the scheme, it treats them as -1 and 1.
        return delta < 0.0 ? baseLength + baseLength * delta : baseLength + (1.0 - baseLength) * delta;
    }
    let sum = baseLength + delta;

    if (sum < 0.0 || sum < minThreshold && baseLength >= minThreshold) {
        switch (onOverflow.type()) {
            case kOverflowClip:
                sum = minThreshold;
                break;
            case kOverflowWraparound:
                sum += 1.0 - minThreshold;
                // I.e., sum = 1.0 - (minThreshold - sum);
                if (sum < minThreshold) {
                    sum = minThreshold;
                }
                break;
            case kOverflowReflect:
                sum = 2.0 * minThreshold - sum;
                // I.e., minThreshold plus the distance by which the sum overshot minThreshold
                break;
            case kOverflowNegate:
                sum = baseLength - delta;
                break;
        }
        // Negating or reflecting may cause the new sum to exceed the outer limit instead of
        // The inner one. We don't want to keep flip-flopping between the two limits.
        // This overflow at both ends can only happen for deltas greater than (1-minThreshold)/2
        // And base colors near the mid-range. Since such deltas indicate an attempt to create
        // A large spread, pick either minThreshold or 1.0, whichever is farther away from the base.
        if (sum > 1.0) {
            if (1.0 - baseLength >= Math.abs(baseLength - minThreshold)) { sum = 1.0; } else { sum = minThreshold; }
        }
    } else if (sum > 1.0) {
        switch (onOverflow.type()) {
            case kOverflowClip:
                sum = 1.0;
                break;
            case kOverflowWraparound:
                sum = minThreshold + (sum - 1.0);
                if (sum > 1.0) { sum = 1.0; }
                break;
            case kOverflowReflect:
                sum = 2.0 - sum;
                break;
            case kOverflowNegate:
                sum = baseLength - delta;
                break;
        }
        // Negating or reflecting may cause the new sum to be less than the minThreshold instead
        // Of greater than 1. We want a large spread, but a positive original delta means we are
        // Biased towards getting away from the min, so pick 1.0 or 1.0 - delta, whichever is
        // Farther away from the base.
        if (sum < minThreshold) {
            if (1.0 - baseLength >= Math.abs(baseLength - (1.0 - delta))) { sum = 1.0; } else { sum = Math.max(1.0 - delta, minThreshold); }
        }
    }
    return sum;
};
// Removed relativeColorRegionImpliedBaseLength function as it was never called in the  current implementation

function relativeColorRegionImpliedBaseLength2(newDerivedLength, delta, minDelta, maxDelta) {
    // Not yet implemented
    return newDerivedLength - delta;
}

function relativeColorRegionScrunchDelta(baseLength, newDerivedLength, minDelta, maxDelta) {
    if (newDerivedLength > baseLength && baseLength + maxDelta > 1.0) {
        // We are within an outside scrunched region
        // (There is no need to test for division by 0, because (baseLength + maxDelta) > 1.0
        // Implies that maxDelta > 0, since the baseLength can't be > 1.)
        return (newDerivedLength - baseLength) / maxDelta;
    } else if (newDerivedLength < baseLength && baseLength + minDelta < 0.0) {
        // We are within an inside scrunched region
        // (There is no need to test for division by 0, because (baseLength + minDelta) < 0
        // Implies that minDelta < 0, since the baseLength can't be < 0.)
        return (baseLength - newDerivedLength) / minDelta;
    }

    return newDerivedLength - baseLength;
}


function RelativeColorRegion() {
    const self = this;

    self.parentScheme = function () {
        return _fScheme;
    };

    self.SetZeroWidthDeltas = function (angleDelta, radiusDelta, heightDelta, linked) {
        _fAngleWidth = _fRadiusWidth = _fHeightWidth = 0;
        self.fThetaCoefficient = 0;
        self.fThetaFrom180 = false;

        self.fLinkHue = _fLinkRadius = _fLinkHeight = linked;

        _fAngleDelta = polarPointCanonicalAnglePlusMinus180(angleDelta);
        self.fRadiusDelta = polarColorRegionConstrainToUnitVector(radiusDelta);
        self.fHeightDelta = polarColorRegionConstrainToUnitVector(heightDelta);
    };

    self.setColorScheme2 = function (inScheme, angleDelta, radiusDelta, heightDelta, linked) {
        self.SetZeroWidthDeltas(angleDelta, radiusDelta, heightDelta, linked);
        if (inScheme !== null && !isUndefinedOrNull(inScheme)) {
            _fScheme = inScheme;
            _fOnRadiusOverflow.type(kOverflowScrunch);
            _fOnHeightOverflow.type(kOverflowScrunch);
            inScheme.addRegion(self);
        } else {
            _fOnRadiusOverflow.type(kOverflowClip);
            _fOnHeightOverflow.type(kOverflowClip);
        }
        return self;
    };


    function _setDefinition(angleDelta, radiusDelta, heightDelta, angleWidth, radiusWidth, heightWidth, linkHue, thetaCoefficient, from180, linkRadius, linkHeight) {
        _fAngleDelta = polarPointCanonicalAnglePlusMinus180(angleDelta);

        self.setRadiusDelta(radiusDelta);
        self.setHeightDelta(heightDelta);

        _fAngleWidth = polarPointCanonicalAngle0To360(angleWidth);
        _fRadiusWidth = polarColorRegionConstrainToUnitRange(radiusWidth);
        _fHeightWidth = polarColorRegionConstrainToUnitRange(heightWidth);
        self.fLinkHue = linkHue;
        self.fThetaCoefficient = polarColorRegionConstrainToUnitVector(thetaCoefficient);
        self.fThetaFrom180 = from180;
        _fLinkRadius = linkRadius;
        _fLinkHeight = linkHeight;

        if (_fScheme !== null && _fScheme.hasRule()) {
            _fScheme.setCreatingRule(null);
        }
    }


    self.setColorScheme5 = function (inScheme, angleDelta, radiusDelta, heightDelta, linkHue, thetaCoefficient, from180, linkRadius, linkHeight) {
        _setDefinition(angleDelta, radiusDelta, heightDelta, 0, 0, 0,
            linkHue, thetaCoefficient, from180, linkRadius, linkHeight);

        if (inScheme !== null) {
            _fScheme = inScheme;
            _fOnRadiusOverflow.type(kOverflowScrunch);
            _fOnHeightOverflow.type(kOverflowScrunch);
            inScheme.addRegion(self);
        } else {
            _fOnRadiusOverflow.type(kOverflowClip);
            _fOnHeightOverflow.type(kOverflowClip);
        }
        return self;
    };


    self.setAngleDelta = function (angleDelta) {
        _fAngleDelta = polarPointCanonicalAnglePlusMinus180(angleDelta);
        return self;
    };


    // Note: setRadiusDelta and setHeightDelta intentionally do not update the min/max delta's
    // In the parent scheme, because (1) they are often called during construction of new regions
    // But before the addRegion, and addRegion takes care of that, and (2) when it isn't called
    // During construction, it is likely to be called in a loop that does something to all the
    // Region deltas (such as moving the base color when it is unlinked, or adjusting the global
    // Brightness or saturation), in which case it is better to calculate the min/max values
    // After all the regions have been set, so that we don't get an n-squared situation scanning
    // For the new outliers when multiple "edge" regions are being moved inward.
    //
    // For situations where an individual region's delta is changing independently of others after
    // It is meaningfully attached to a scheme, use MoveRadiusDelta or MoveHeightDelta instead.

    self.setRadiusDelta = function (radiusDelta) {
        self.fRadiusDelta = polarColorRegionConstrainToUnitVector(radiusDelta);
        return self;
    };

    self.setHeightDelta = function (heightDelta) {
        self.fHeightDelta = polarColorRegionConstrainToUnitVector(heightDelta);
        return self;
    };


    self.setLinkHue = function (linkhue) {
        self.fLinkHue = linkhue;
        return self;
    };


    self.setOnRadiusOverflow = function (onOverflow) {
        _fOnRadiusOverflow = onOverflow;
        return self;
    };

    self.setOnHeightOverflow = function (onOverflow) {
        _fOnHeightOverflow = onOverflow;
        return self;
    };

    self.derivedColor = function (baseColor) {
        if (isUndefinedOrNull(baseColor)) {
            baseColor = null;
        }
        // The CylindricalColor constructor takes care of putting the angle in canonical range;
        // DerivedLength handles range coersion for radius and height.
        if (baseColor === null) {
            if (_fScheme) {
                return self.derivedColor(_fScheme.getBaseCylPoint());
            }

            return self.derivedColor(new CylindricalColor(0.0, 1.0, 1.0));
        }
        return new CylindricalColor().setTo(baseColor.angle() + _fAngleDelta,
            _derivedRadius(baseColor.radius()),
            _derivedHeight(baseColor.height()));
    };


    function _derivedHeight(baseHeight) {
        if (self.fHeightDelta === 0.0) {
            return baseHeight;
        }

        // Regardless of overflow treatment, if this is a derived region in a preset rule with a positive offset
        // And there is "underflow" due to a very dark base color (such as black), push the height of derived
        // Regions up to kFlipAtMinH.
        if (!_fAllowThresholdUnderflow && self.fHeightDelta > 0 && _fScheme && _fScheme.hasRule() && baseHeight + self.fHeightDelta < 0.2) {
            return 0.2;
        }

        // For other cases, the derived radius may depend on the overflow method.
        if (_fOnHeightOverflow.type() == kOverflowScrunch && _fScheme) {
            return Math.max(0.001, relativeColorRegionDerivedLengthScrunch(baseHeight, self.fHeightDelta,
                _fScheme.minHeightDelta(), _fScheme.maxHeightDelta()));
        }
        return Math.max(0.001, relativeColorRegionDerivedLength(baseHeight, self.fHeightDelta, _fOnHeightOverflow, _fAllowThresholdUnderflow ? 0 : 0.2));
    }


    function _derivedRadius(baseRadius) {
        if (self.fRadiusDelta === 0.0) { return baseRadius; }

        // Regardless of overflow treatment, if this is a derived region in a preset rule with a positive offset
        // And there is "underflow" due to a very desaturated base color (such as white or gray), push the radius
        // Of derived regions up to kFlipAtMinR.
        if (!_fAllowThresholdUnderflow && self.fRadiusDelta > 0 && _fScheme && _fScheme.hasRule() && baseRadius + self.fRadiusDelta < 0.1) { return 0.1; }

        // For other cases, the derived radius may depend on the overflow method.
        if (_fOnRadiusOverflow.type() == kOverflowScrunch && _fScheme) {
            return relativeColorRegionDerivedLengthScrunch(baseRadius, self.fRadiusDelta,
                _fScheme.minRadiusDelta(), _fScheme.maxRadiusDelta());
        } return relativeColorRegionDerivedLength(baseRadius, self.fRadiusDelta, _fOnRadiusOverflow, _fAllowThresholdUnderflow ? 0 : 0.1);
    }


    // Moves the region to the coord specified by newColor. Other regions that are linked to this region will update.
    // Broadcasts RegionsMovedMessaged at the end
    // If regionUserData is NULL, then NotifyChange will be called to mark the regionUserData as invalid.
    // If regionUserData is specified, then regionUserData will be stored with the region and NotifyChange will NOT be called,
    // Except if the region is either the base color or causes the base color to change, then NotifyChange will be
    // Called for ALL linked regions (under the assumption that most user data is a function of both the relative color and
    // The scheme's base color.) The base color notification, if any, will precede the attachment of the new regionUserData,
    // So that the new region user data will override any old user data and not be notified of a change.
    //
    // It also intentionally does not modify the min/max deltas stored in the scheme, even though it changes the deltas.
    // It is intended for situations where every color in a scheme is being adjusted proportionally. The client should
    // Instead call ColorScheme::ResetMinMaxDeltas after all the colors have been adjusted.
    // (Although I suppose I should add an optional parameter "syncSchemeMinMaxDeltas" for situations in which only a
    // Single color is being adjusted.)

    self.moveToColor = function (newColor) {
        const isBaseRegion = self.isBaseRegion();
        let newBaseColor;

        const oldBaseColor = _fScheme.getBaseCylPoint();


        if (isBaseRegion) {
            if (newColor.equivalent(oldBaseColor)) {
                return; // Null change
            }

            _fScheme.setBaseColor(newColor, true);
        } else {
            // Suppress broadcasting until we are finished making all the changes to the scheme
            //StStopBroadcasting stopBroadcasting( *_fScheme );

            // Set up the relative offsets so that the derivedColor of this region from the
            // Parent scheme's base color will be the newColor. Additionally, if this region has any
            // Links turned on, adjust either the theta or the base color of the parent scheme.

            const oldDerivedColor = self.derivedColor(oldBaseColor);

            newBaseColor = oldBaseColor;
            let ruleAdjusted = false;


            if (newColor.equivalent(oldDerivedColor)) {
                return; // Null change
            }

            // Handle any changes to hue
            if (oldDerivedColor.angle() !== newColor.angle()) {
                /* There are three possibilities:
            If linkHue is false, we change our own angleDelta, and nothing else.
            If linkHue is true, and thetaCoefficient is 0, then we change the base color of the scheme
            If linkHue is true, and thetaCoefficent is non-zero, then we change the theta of the scheme,
            and the scheme will in turn change the angleDelta of any regions with a non-zero thetaCoefficient
            (including this one.)
        */

                const newAngleDelta = polarPointCanonicalAnglePlusMinus180(
                    newColor.angle() - oldBaseColor.angle());

                // Conditions to treat hue as linked:
                // (_fScheme!==NULL AND UnlinkAll=false AND fLinkHue=true) OR isBaseRegion=true
                if (_fScheme !== null && self.fLinkHue || isBaseRegion) {
                    if (self.fThetaCoefficient === 0) {
                        // This region is "locked" to the base hue. Keep our _fAngleDelta the same, and move
                        // The parent scheme's BaseColor so that our derived color will end up at this new hue.
                        // (This will in turn trigger changes to the derived colors of all other regions when
                        // We do the setBaseColor.)
                        const newBaseAngle = polarPointCanonicalAngle0To360(
                            newColor.angle() - _fAngleDelta);

                        newBaseColor.angle(newBaseAngle);
                    } else {
                        // This region is linked to theta. Keep the base color the same, and change the theta
                        // Of the scheme so that the equation _fAngleDelta = thetaCoefficient*theta will remain true.
                        // (Or if fThetaFrom180 is true, then _fAngleDelta = 180 + thetaCoefficient*theta )

                        // What should we do if the newAngleDelta is on the other side of the diameter from the
                        // Base angle? There are three reasonable possibilities: (1) clip it to the same side, possibly
                        // Even to some minimal distance from the diameter; (2) move the base color as well, as if
                        // The region being moved pushed against it, or (3) let it go past, and flip the sign of the
                        // Other regions.
                        let newTheta;

                        if (self.fThetaFrom180) {
                            newTheta = self.fThetaCoefficient < 0 ? (newAngleDelta + 180) / self.fThetaCoefficient : (newAngleDelta - 180) / self.fThetaCoefficient;
                        } else {
                            newTheta = newAngleDelta / self.fThetaCoefficient;
                        }
                        ruleAdjusted = true;
                        _fScheme.setTheta(newTheta);
                    }
                } else {
                    ruleAdjusted = true;
                    _fAngleDelta = newAngleDelta;
                }
            }

            // Handle any changes to radius
            if (oldDerivedColor.radius() !== newColor.radius()) {
                // Conditions to treat radius as linked:
                // (_fScheme!==NULL AND UnlinkAll=false AND fLinkRadius=true) OR isBaseRegion=true

                // If the region is being explicitly moved to a color near the wheel center, stop enforcing
                // The derived radius and height to be above the thresholds. The threshold is meant to keep
                // "slave" regions from falling into the center when the base color moves, but it isn't meant
                // To keep the user from explicitly moving non-base markers to zero. The test is here rather
                // Than in MoveRadiusDelta because we don't want AdjustForNewBase to cause an underflow relaxation.
                // (This is a permanent relaxation of the overflow rules - we never restore the restriction
                // To a given region once it is broken.)

                if (!isBaseRegion && newColor.radius() < 0.1) {
                    // _fAllowThresholdUnderflow = true;
                    // // If the user sets the radius all the way down to zero (or so close as to seem zero),
                    // // and it is less than the base color, then additionally turn off all fancy reflection
                    // // or wrapping rules, or moving the base marker will make it move off zero again (possibly
                    // // jumping all the way up to one), and that probably isn't what the user intended when they
                    // // made the color white or gray. We don't do this if it is just going to something like 5%,
                    // // because the user is more likely to expect colors with noticeable hue to continue to
                    // // track the base color in the same way they did before being moved.
                    if (newColor.radius() <= 0.01 && oldBaseColor.radius() > newColor.radius()) {
                        _fOnRadiusOverflow = new OverflowResponse(kOverflowScrunch);
                    }
                    //_fOnRadiusOverflow.type(kOverflowScrunch);
                }

                if (_fScheme !== null && _fLinkRadius || isBaseRegion) {
                    // This region is locked to the base radius. Keep our this.fRadiusDelta the same, and move
                    // The parent scheme's BaseColor so that our derived color will end up at this radius.
                    // (This will in turn trigger changes to the derived colors of all other regions when
                    // We do the setBaseColor.)
                    // [Note: Since the Color Harmony plugin now turns off linkRadius and linkHeight on all
                    // Except the base region, this block will not be entered by the Color Harmony plugin.]
                    const newBaseRadius = _newBaseRadius(newColor.radius());

                    newBaseColor.radius(newBaseRadius);
                } else {
                    const newRadiusDelta = _newRadiusDelta(oldBaseColor.radius(), newColor.radius());

                    if (newRadiusDelta !== self.fRadiusDelta) {
                        ruleAdjusted = true;
                        _moveRadiusDelta(newRadiusDelta);
                    }
                }
            }

            // Handle any changes to height
            if (oldDerivedColor.height() !== newColor.height()) {
                // Conditions to treat height as linked
                // (_fScheme!==NULL AND UnlinkAll=false AND fLinkHeight=true) OR isBaseRegion=true

                if (!isBaseRegion && newColor.height() < 0.2) {
                    // See comments above in Radius case
                    _fAllowThresholdUnderflow = true;
                    if (newColor.height() <= 0.01 && oldBaseColor.height() > newColor.height()) { _fOnHeightOverflow = new OverflowResponse(kOverflowScrunch); }
                }

                if (_fScheme !== null && _fLinkHeight || isBaseRegion) {
                    // This region is locked to the base height. Keep our this.fHeightDelta the same, and move
                    // The parent scheme's BaseColor so that our derived color will end up at this height.
                    // (This will in turn trigger changes to the derived colors of all other regions when
                    // We do the setBaseColor.)
                    // [Note: Since the Color Harmony plugin now turns off linkRadius and linkHeight on all
                    // Except the base region, this block will not be entered by the Color Harmony plugin.]
                    const newBaseHeight = _newBaseHeight(newColor.height());

                    newBaseColor.height(newBaseHeight);
                } else {
                    const newHeightDelta = _newHeightDelta(oldBaseColor.height(), newColor.height());

                    if (newHeightDelta !== self.fHeightDelta) {
                        ruleAdjusted = true;
                        _moveHeightDelta(newHeightDelta);
                    }
                }
            }
            // Set the newBaseColor (we don't need to check for equivalency because setBaseColor does that.)
            _fScheme.setBaseColor(newBaseColor);

            // Error checking
            // Assert( derivedColor(newBaseColor).Equivalent(newColor) );

            if (ruleAdjusted) {
                _fScheme.setModifiedFromCreatingRule(true);
            }
        } // End scope of stopBroadcasting
    };

    function _newHeightDelta(baseHeight, newDerivedHeight) {
        // See comment above
        if (_fScheme === null || _fOnHeightOverflow.type() !== kOverflowScrunch) { return newDerivedHeight - baseHeight; }

        return relativeColorRegionScrunchDelta(baseHeight, newDerivedHeight, _fScheme.minHeightDelta(), _fScheme.maxHeightDelta());
    }

    // Note: This should NOT be called in a loop that is moving all or most of the colors in a scheme.
    // Anything that is doing that should call setRadiusDelta instead, followed by ResetMinMaxRadiusDeltas
    // On the parent scheme after the whole loop is done.
    function _moveRadiusDelta(newRadiusDelta) {
        // Do the min/max radius values on the scheme need to be adjusted?
        // (This is only called when we already know _fScheme is non-null.)
        let region;

        if (newRadiusDelta < self.fRadiusDelta) {
            if (newRadiusDelta < _fScheme.minRadiusDelta()) {
                _fScheme.minRadiusDelta(newRadiusDelta);
            } else if (self.fRadiusDelta == _fScheme.maxRadiusDelta() && self.fRadiusDelta > 0) {
                self.fRadiusDelta = newRadiusDelta;

                // A region that used to be the longest is moving inward.
                // Scan to see where the new long pole is.
                let newMax = 0;

                for (region in _fScheme.regions()) {
                    if (region.fRadiusDelta > newMax) {
                        newMax = region.fRadiusDelta;
                    }
                }

                _fScheme.maxRadiusDelta(newMax);
            }
        } else if (newRadiusDelta > self.fRadiusDelta) {
            if (newRadiusDelta > _fScheme.maxRadiusDelta()) { _fScheme.maxRadiusDelta(newRadiusDelta); } else if (self.fRadiusDelta == _fScheme.minRadiusDelta() && self.fRadiusDelta < 0) {
                self.fRadiusDelta = newRadiusDelta;

                // A region that used to be the shortest is moving outward.
                // Scan to see where the new closest region to the center (most negative delta) is.
                let newMin = 0;

                for (region in _fScheme.regions()) {
                    if (region.fRadiusDelta < newMin) {
                        newMin = region.fRadiusDelta;
                    }
                }

                _fScheme.minRadiusDelta(newMin);
            }
        }

        self.fRadiusDelta = newRadiusDelta;
    }


    // Note: This should NOT be called in a loop that is moving all or most of the colors in a scheme.
    // Anything that is doing that should call setHeightDelta instead, followed by ResetMinMaxHeightDeltas
    // On the parent scheme after the whole loop is done.
    function _moveHeightDelta(newHeightDelta) {
        // Do the min/max height values on the scheme need to be adjusted?
        // (This is only called when we already know _fScheme is non-null.)
        let region;

        if (newHeightDelta < self.fHeightDelta) {
            if (newHeightDelta < _fScheme.minHeightDelta()) { _fScheme.minHeightDelta(newHeightDelta); } else if (self.fHeightDelta == _fScheme.maxHeightDelta() && self.fHeightDelta > 0) {
                self.fHeightDelta = newHeightDelta;

                // A region that used to be the longest is moving inward.
                // Scan to see where the new long pole is.
                let newMax = 0;

                for (region in _fScheme.regions()) {
                    if (region.fHeightDelta > newMax) {
                        newMax = region.fHeightDelta;
                    }
                }

                _fScheme.maxHeightDelta(newMax);
            }
        } else if (newHeightDelta > self.fHeightDelta) {
            if (newHeightDelta > _fScheme.maxHeightDelta()) { _fScheme.maxHeightDelta(newHeightDelta); } else if (self.fHeightDelta == _fScheme.minHeightDelta() && self.fHeightDelta < 0) {
                self.fHeightDelta = newHeightDelta;

                // A region that used to be the shortest is moving outward.
                // Scan to see where the new closest region to the center (most negative delta) is.
                let newMin = 0;

                for (region in _fScheme.regions()) {
                    if (region.fHeightDelta < newMin) {
                        newMin = region.fHeightDelta;
                    }
                }

                _fScheme.minHeightDelta(newMin);
            }
        }

        self.fHeightDelta = newHeightDelta;
    }

    function _newRadiusDelta(baseRadius, newDerivedRadius) {
        // If the newDerivedLength is within a region that is being scrunched to avoid
        // Overflow, then compute the new delta relative to the unscrunched length of
        // That region rather than the scrunched length, so that when the base color
        // Moves it will maintain its new position relative to the other colors in the
        // Scrunched region. For all other cases (either the overflow method is not
        // KOverflowScrunch or the newDerivedLength is in the unscrunched region of the
        // Wheel), just return the absolute delta.

        // This means that if we are doing some other kind of overflow management, such as
        // Wrap, reflect or clip, and the base color is moved so that a derived color is being
        // Modified to avoid overflow, and then that derived marker is explicitly moved,
        // Its delta will be changed so that the new location is derived without overflow
        // Management.

        if (_fScheme === null || _fOnRadiusOverflow.type() !== kOverflowScrunch) {
            return newDerivedRadius - baseRadius;
        }

        return relativeColorRegionScrunchDelta(baseRadius, newDerivedRadius, _fScheme.minRadiusDelta(), _fScheme.maxRadiusDelta());
    }

    function _newBaseHeight(newDerivedHeight) {
        if (_fScheme !== null && _fOnHeightOverflow.type() == kOverflowScrunch) {
            return relativeColorRegionImpliedBaseLength2(newDerivedHeight, self.fHeightDelta, _fScheme.minHeightDelta(), _fScheme.maxHeightDelta());
        }
        // Else{
        //   Return relativeColorRegionImpliedBaseLength( newDerivedHeight, self.fHeightDelta, _fOnHeightOverflow );}
    }

    function _newBaseRadius(newDerivedRadius) {
        if (_fScheme !== null && _fOnRadiusOverflow.type() == kOverflowScrunch) {
            return relativeColorRegionImpliedBaseLength2(newDerivedRadius, self.fRadiusDelta, _fScheme.minRadiusDelta(), _fScheme.maxRadiusDelta());
        }
        //Else{
        //  Return relativeColorRegionImpliedBaseLength( newDerivedRadius, self.fRadiusDelta, _fOnRadiusOverflow );}
    }


    // Returns true if this region has a parent scheme and its definition is such that its
    // Derived color will always be equal to the scheme's base color, that is, its deltas
    // Are all zero and its links are all true. In practice it is likely that every scheme
    // Will have exactly one base region, but there is no requirement in the HarmonyEngine
    // That that be the case. Theoretically a scheme might have none or multiple base regions.
    self.isBaseRegion = function () {
        return _fScheme && _fAngleDelta === 0 && self.fRadiusDelta === 0 && self.fHeightDelta === 0 && self.fLinkHue === true && _fLinkRadius === true && _fLinkHeight === true && self.fThetaCoefficient === 0;
    };

    // Note that links are only relevant in the context of a ColorScheme (see HarmonyFormula.h),
    // Since they control how other regions in the same scheme move when one region in the scheme
    // Is adjusted.
    // Changing these should NOT call NotifyChange()
    self.fLinkHue = false; // Links hue to base color when the _fScheme.fUnlinkAll is false
    var _fLinkRadius = false; // Links radius to base color when _fScheme.fUnlinkAll is false
    var _fLinkHeight = false; // Links height to base color when _fScheme.fUnlinkAll is false


    // IMPORTANT!!! Any functions that modify the following member variables must call NotifyChange()
    var _fAngleWidth = 0;
    var _fAngleDelta = 0;

    self.fRadiusDelta = 0;
    self.fHeightDelta = 0;
    var _fHeightWidth = 0;
    var _fRadiusWidth = 0;

    self.fThetaCoefficient = 0;
    self.fThetaFrom180 = false; // Only relevant if fLinkHue is true and fThetaCoefficient is non-zero
    // If true, the theta multiple is an offset from the base plus 180 degrees
    // If false, the theta multiple is an offset from the base
    // (The pentagram color scheme has two arms that are at +/- theta from the base,
    // And two arms that are at +/- theta/2 from the complement.)
    var _fOnRadiusOverflow = new OverflowResponse(kOverflowClip);
    var _fOnHeightOverflow = new OverflowResponse(kOverflowClip);
    var _fScheme = null; // The scheme that this region is within
    var _fAllowThresholdUnderflow = false;
}


function ColorScheme() {
    this.regions = function () {
        return _fColorRegions;
    };

    this.hasRule = function () {
        return _fHasRule;
    };

    this.setCreatingRule = function (rule) {
        if (rule !== null) { _fHasRule = true; } else { _fHasRule = false; }
        _fRuleModified = false;
        _fCUSTOMRuleID = 0;
    };


    this.setModifiedFromCreatingRule = function (modified) {
        _fRuleModified = modified;
    };

    this.minRadiusDelta = function (min) {
        if (!isUndefinedOrNull(min)) {
            _fMinRadiusDelta = min;
        } else {
            return _fMinRadiusDelta;
        }
    };

    this.minHeightDelta = function (min) {
        if (!isUndefinedOrNull(min)) {
            _fMinHeightDelta = min;
        } else {
            return _fMinHeightDelta;
        }
    };
    this.maxRadiusDelta = function (max) {
        if (!isUndefinedOrNull(max)) {
            _fMaxRadiusDelta = max;
        } else {
            return _fMaxRadiusDelta;
        }
    };
    this.maxHeightDelta = function (max) {
        if (!isUndefinedOrNull(max)) {
            _fMaxHeightDelta = max;
        } else {
            return _fMaxHeightDelta;
        }
    };

    this.setTo = function () {
        _fBaseColor = new CylindricalColor(0, 1.0, 1.0);
        return this;
    };

    this.getBaseRegion = function () {
        for (let i = 0; i < _fColorRegions.length; i++) {
            const region = _fColorRegions[i];

            if (region.isBaseRegion()) {
                return region;
            }
        }
        return null;
    };


    this.addRegion = function (newRegion) {
        if (newRegion !== null && !isUndefinedOrNull(newRegion)) {
            if (newRegion.fRadiusDelta < _fMinRadiusDelta) {
                _fMinRadiusDelta = newRegion.fRadiusDelta;
            } else if (newRegion.fRadiusDelta > _fMaxRadiusDelta) {
                _fMaxRadiusDelta = newRegion.fRadiusDelta;
            }
            if (newRegion.fHeightDelta < _fMinHeightDelta) {
                _fMinHeightDelta = newRegion.fHeightDelta;
            } else if (newRegion.fHeightDelta > _fMaxHeightDelta) {
                _fMaxHeightDelta = newRegion.fHeightDelta;
            }
            _fColorRegions.push(newRegion);

            _fHasRule = false;
            _fRuleModified = false;
        }
    };

    this.getBaseCylPoint = function () {
        return _fBaseColor;
    };


    this.setBaseColor = function (baseColor) {
        if (!baseColor.equivalent(_fBaseColor)) {
            _fBaseColor = baseColor;
        }
    };

    this.setTheta = function (newTheta) {
        if (_fTheta != newTheta) {
            _fTheta = newTheta;

            for (let i = 0; i < _fColorRegions.length; i++) {
                const region = _fColorRegions[i];

                if (region.fLinkHue && region.fThetaCoefficient !== 0) {
                    var newAngleDelta;
                    const thetaCoefficient = region.fThetaCoefficient;

                    if (region.fThetaFrom180) {
                        newAngleDelta = 180 + thetaCoefficient * _fTheta;
                    } else {
                        newAngleDelta = thetaCoefficient * _fTheta;
                    }
                    region.setAngleDelta(newAngleDelta);
                }
            }
        }
    };

    this.setRegionsToBaseOnly = function (initialTheta) {
        const regionCt = _fColorRegions.length;
        let newRegion;

        // Set the base region
        if (regionCt < 1) {
            newRegion = new RelativeColorRegion().setColorScheme2(this, 0, 0, 0, false);
        } else {
            for (let i = 0; i < regionCt; i++) {
                const region = _fColorRegions[i];

                if (region.isBaseRegion()) {
                    _fColorRegions = [region];
                    break;
                }
            }

            _fColorRegions[0].SetZeroWidthDeltas(0, 0, 0, true);
        }

        _fTheta = initialTheta;
        _fHasRule = false;
        _fRuleModified = false;
        _fCUSTOMRuleID = 0;

        _fMinRadiusDelta = _fMaxRadiusDelta = _fMinHeightDelta = _fMaxHeightDelta = 0;
    };


    this.clearRegionList = function () {
        _fColorRegions = [];
        //.splice( 0, _fColorRegions.length );
        //While ( _fColorRegions.length > 0 )
        //  _fColorRegions.pop();

        _fHasRule = false;
        _fRuleModified = false;
        _fCUSTOMRuleID = 0;

        _fMinRadiusDelta = _fMaxRadiusDelta = _fMinHeightDelta = _fMaxHeightDelta = 0;
    };

    var _fHasRule = false;

    // If this ColorScheme was created by a HarmonyRule and has not been modified
    // In a way that "breaks" the rule, then the kind of rule which created it,
    // Otherwise kHRK_None. Only HarmonyRule should be setting this to anything
    // Other than kHRK_None. (Well, either that or an input function which constructs
    // Color schemes by reading them from a file or dictionary.)
    var _fCUSTOMRuleID = 0;
    // If this ColorScheme was created by a CUSTOMRule, then the ID of that rule

    var _fRuleModified = false;
    // This is only relevant when fCreatingRule is not kHRK_None. If theta is changed,
    // Or if one of the brightness or saturation deltas change but the links are
    // Preserved, then fRuleModified is set to true and fCreatingRule stays unchanged.
    // If regions are added, deleted, or if the links are broken, then fCreatingRule
    // Is set to kHRK_None.

    var _fTheta = 0;
    var _fColorRegions = []; // Array of RelativeColorRegion

    // Note: zero works for the initial min and max deltas because a base region has all deltas
    // As zero, and the rules work must behave as if there was a base region even if for some
    // Odd reason none is created.

    var _fMinRadiusDelta = 0; // The minimum fRadiusDelta for any region
    var _fMaxRadiusDelta = 0; // The maximum fRadiusDelta for any region
    var _fMinHeightDelta = 0; // The minimum fHeightDelta for any region
    var _fMaxHeightDelta = 0; // The maximum fHeightDelta for any region

    var _fBaseColor = new CylindricalColor().setTo(0, 1.0, 1.0);
}


const HarmonyFormula = function () {
    const _fColorSchemes = [];

    this.schemes = function () { return _fColorSchemes; };
};

//Rule.as
function Rule() {
    this._fName = null;

    this.setSchemeToRule = function (colorScheme) {
        this.setSchemeToRuleImpl(colorScheme);
    };

    this.setFormulaToRule = function (harmonyFormula) {
        if (harmonyFormula.schemes().length === 0) {
            this.addSchemeToFormulaImpl(harmonyFormula);
        } else {
            while (harmonyFormula.schemes().length > 1) {
                harmonyFormula.schemes().pop();
            }
            this.setSchemeToRuleImpl(harmonyFormula.schemes()[0]);
        }
    };

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        return null;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
    };

    this.addDependentRegions = function (colorScheme) {
    };
}


//ANALOGOUS.as
Rule.ANALOGOUS = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'ANALOGOUS';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(30.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(30.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;
        //                                                                  DA    dR     dH  linkA theta fromC  linkR  linkH

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 30.0, 0.8, 0.05, true, 1.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowReflect));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 15.0, 0.4, 0.09, true, 0.5, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowReflect));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -15.0, 0.2, 0.09, true, -0.5, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowReflect));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -30.0, 0.05, 0.05, true, -1.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowReflect));

        // Set radius and height deltas to a small positive offset, so that base colors of white, black or
        // Gray will allow some hue to show in the derived colors. (The base color will be unchanged, and
        // Will be interpreted as if its hue were red, so the ANALOGOUS colors will be reddish.) Also stagger
        // The brightness of the intermediate colors slightly to allow them to be discriminated more easily,
        // Although not as much as in ANALOGOUS 2. By setting the height overflow method to Negate on only
        // The two colors with the 15% hue shift, we are letting them become darker than the outside and base
        // Colors if they can't become brighter.

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

//We do not use javascript features requiring this
// Rule.ANALOGOUS.prototype = new Rule();
// Rule.ANALOGOUS.prototype.constructor = Rule.ANALOGOUS;


Rule.COMPLEMENTARY = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'COMPLEMENTARY 2';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(30.0);

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(180.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        //                                                                    DA     dR    dH   linkA  theta fromC  linkR  linkH
        let newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.1, -0.3, true, 0.0, false, false, false);
        // Darker shade of base

        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        //    Flips to lighter if base is dark
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, -0.1, 0.3, true, 0.0, false, false, false);
        // Lighter tint of base
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowScrunch));
        //    Scrunches if base is light
        //    (We don't want it to reflect
        //    Because we already have a -0.3
        //    Region that it would nearly
        //    Coincide with.)

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 180.0, 0.2, -0.3, true, 0.0, false, false, false);
        // Darkened complement
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        //    Flips to lighter if base is dark

        new RelativeColorRegion().setColorScheme5(colorScheme, 180.0, 0.0, 0.0, true, 0.0, false, false, false);
        // Pure complement

        /*
    newRegion = new RelativeColorRegion().setColorScheme5( colorScheme, 170.0, -0.1,  0.2,  true,   0.0,  false, false, false );// lightened off-complement
    newRegion.setOnRadiusOverflow( new OverflowResponse( kOverflowNegate ) );
    newRegion.setOnHeightOverflow( new OverflowResponse( kOverflowNegate ) );
    */
        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

//We do not use javascript features requiring this
// Rule.COMPLEMENTARY.prototype = new Rule();
// Rule.COMPLEMENTARY.prototype.constructor = Rule.COMPLEMENTARY;

Rule.COMPOUND = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'COMPOUND1';

    this.addDependentRegions = function (colorScheme) {
        let newRegion;

        //                                                      DA    dR     dH  linkA theta fromC  linkR  linkH
        // Clockwise hue shift, slightly brighter
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 30.0, 0.1, 0.2, true, 0.0, false, false, false);
        // Flips to less saturated if base is bright
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        // Flips to darker if base is light
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // Lighter tint of clockwise hue
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 30.0, -0.4, 0.4, true, 0.0, false, false, false);
        //  Flips to more saturated if base is desaturated
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        // Flips to darker if base is light
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // Off-complement, desaturated
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 165, -0.25, 0.05, true, 0.0, false, false, false);
        // Flips to more saturated if base is desaturated
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // Off-complement, slightly brighter
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 150, 0.1, 0.2, true, 0.0, false, false, false);
        // Flips to less saturated if base is bright
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        // Flips to darker if base is light
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        /*
    // lighter tint of off-complement
    newRegion = new RelativeColorRegion().setColorScheme5( colorScheme, 150, -0.4, 0.4, true, 0.0, false, false, false );
    // flips to more saturated if base is desaturated
    newRegion.setOnRadiusOverflow( new OverflowResponse( kOverflowNegate ) );
    // flips to darker if base is light
    newRegion.setOnHeightOverflow( new OverflowResponse( kOverflowNegate ) );
    */
        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(30.0);

        this.addDependentRegions(colorScheme);
    };
};

// Rule.COMPOUND.prototype = new Rule();
// Rule.COMPOUND.prototype.constructor = Rule.COMPOUND;

Rule.MONOCHROMATIC = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'MONOCHROMATIC 2';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(0.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(0.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;
        //                                                                  DA   dR  dH linkA theta  fromC  linkR  linkH

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, 0.3, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, -0.3, 0.1, true, 0.0, false, false, true);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, -0.3, 0.3, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, 0.6, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

//We do not use javascript features requiring this
// Rule.MONOCHROMATIC.prototype = new Rule();
// Rule.MONOCHROMATIC.prototype.constructor = Rule.MONOCHROMATIC;


Rule.SHADES = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'SHADES';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(0.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(0.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;
        //                                                DA   dR  dH linkA theta  fromC  linkR  linkH

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, -0.25, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, -0.50, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));

        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, -0.75, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));

        // Added by Ketan to Make 5
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.0, -0.9, true, 0.0, false, true, false);
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowWraparound));
        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

//We do not use javascript features requiring this
// Rule.SHADES.prototype = new Rule();
// Rule.SHADES.prototype.constructor = Rule.SHADES;


Rule.TRIAD = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'TRIAD2';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(120.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(120.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;

        // Darker shade of base
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.1, -0.3, true, 0.0, false, false, false);

        //    Flips to lighter if base is dark
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The positive fork, slightly desaturated
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 120.0, -0.1, 0.0, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, darker shade
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -120.0, 0.1, 0.0, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, lighter tint
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -120.0, 0.05, -0.3, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        // Note: since the thetaCoefficients are defaulted to zero, this is a "locked at 120 degrees" TRIAD2

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

Rule.SQUARE = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'SQUARE';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(90.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(90.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;

        // Darker shade of base
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 0.0, 0.1, 0.0, true, 0.0, false, false, false);

        //    Flips to lighter if base is dark
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The positive fork, slightly desaturated
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 90.0, -0.1, 0.0, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, darker shade
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 180.0, 0.1, 0.0, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, lighter tint
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -90.0, 0.05, 0.0, true, 0.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        // Note: since the thetaCoefficients are defaulted to zero, this is a "locked at 120 degrees" TRIAD2

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};


Rule.SPLIT_COMPLEMENTARY = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'SPLIT_COMPLEMENTARY';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(150.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(0.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;

        // Darker shade of base                                             DA    dR    dH   linkA theta fromC linkR  linkH
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 150.0, -0.1, 0.3, true, 0.5, true, false, false);

        //    Flips to lighter if base is dark
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The positive fork, slightly desaturated
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 150.0, -0.05, 0, true, 0.5, true, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, darker shade
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -150.0, 0.1, 0.3, true, -0.5, true, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, lighter tint
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -150.0, 0.05, 0, true, -0.5, true, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        // Note: since the thetaCoefficients are defaulted to zero, this is a "locked at 120 degrees" TRIAD2

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

Rule.DOUBLE_SPLIT_COMPLEMENTARY = function () {
    const _super = Rule;

    _super.call(this);
    this._fName = 'DOUBLE_SPLIT_COMPLEMENTARY';

    this.addSchemeToFormulaImpl = function (harmonyFormula) {
        const colorScheme = new ColorScheme().setTo(0.0);

        colorScheme.setBaseColor(new CylindricalColor().setTo(0, 1, 1));

        new RelativeColorRegion().setColorScheme2(colorScheme, 0, 0, 0, false);

        this.addDependentRegions(colorScheme);

        harmonyFormula.schemes().push(colorScheme);
        return colorScheme;
    };

    this.setSchemeToRuleImpl = function (colorScheme) {
        colorScheme.setRegionsToBaseOnly(0.0);

        this.addDependentRegions(colorScheme);
    };

    this.addDependentRegions = function (colorScheme) {
        let newRegion;

        // Darker shade of base                                             DA    dR    dH   linkA theta fromC linkR  linkH
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 30, -0.05, 0.0, true, 1.0, false, false, false);

        //    Flips to lighter if base is dark
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The positive fork, slightly desaturated
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, 150, -0.1, 0, true, -1.0, true, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, darker shade
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -150.0, 0.1, 0, true, 1.0, true, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));

        // The negative fork, lighter tint
        newRegion = new RelativeColorRegion().setColorScheme5(colorScheme, -30.0, 0.05, 0.0, true, -1.0, false, false, false);
        newRegion.setOnRadiusOverflow(new OverflowResponse(kOverflowNegate));
        newRegion.setOnHeightOverflow(new OverflowResponse(kOverflowNegate));
        // Note: since the thetaCoefficients are defaulted to zero, this is a "locked at 120 degrees" TRIAD2

        // Record which rule created the scheme. This must be done after all the regions are defined.
        colorScheme.setCreatingRule(this._fName);
    };
};

//We do not use javascript featuresi.e. Properties requiring this
// Rule.TRIAD.prototype = new Rule();
// Rule.TRIAD.prototype.constructor = Rule.TRIAD;

//Equivalent to HarmonyController.as
function HarmonyController() {
    let _fHarmonyFormula, _fCurScheme, _fCurRegion; // The current region must always be in the current scheme

    this.init = function (harmonyFormula, initRule) {
        _fHarmonyFormula = harmonyFormula;


        if (initRule) {
            initRule.setFormulaToRule(_fHarmonyFormula);
        }

        // If there isn't already a current scheme, then make the first scheme the current scheme
        const curScheme = _fCurScheme ? _fCurScheme : _fHarmonyFormula.schemes()[0];

        // Make sure _fCurScheme is valid before broadcasting any messages
        _fCurScheme = curScheme;

        // Init the base region of the new scheme
        _fCurRegion = _fCurScheme.getBaseRegion();
    };

    this.setHarmonyRule = function (harmonyRule, restoreMode) {
        if (harmonyRule) {
            if (restoreMode) { return; }
            harmonyRule.setSchemeToRule(_fCurScheme);
        }

        this.setCurrentRegion(_fCurScheme.getBaseRegion());
    };

    this.getCurrentScheme = function () {
        return _fCurScheme;
    };

    this.setBasePoint = function (point) {
        _fCurScheme.setBaseColor(point);
    };

    // Region can be NULL
    this.setCurrentRegion = function (region) {
        if (_fCurRegion != region) {
            if (region) {
                if (region.parentScheme() == _fCurScheme) {
                    _fCurRegion = region;
                } else {
                    this.SetCurrentScheme(region.parentScheme());
                    _fCurRegion = region;
                }
            } else {
                _fCurRegion = null;
            }
        }
    };

    //   Creates a new HarmonyController component instance.
    _fCurScheme = null;
    this.init(new HarmonyFormula(), new Rule.ANALOGOUS());
}

/**
 * Equivalent to Harmony.as in AS3 and HarmonyAdapter in .cpp
 * Modified to re-use the theme model we have in .js
 */

// This a the function which is realted to code
function HarmonyAdapter(theme, setSwatch) {
    // Public getter / setters:
    this.setToRestoreMode = function () {
        _mode = "restore";
    };

    this.resetMode = function () {
        _mode = "create";
    };

    this.setNewTheme = function (value) {
        if (!isUndefinedOrNull(value)) {
            _colorSet = value;
        }
    }

    this.colorSet = function (value) {
        if (!isUndefinedOrNull(value)) {
            _colorSet = value;
            _changedColorIndex = -1;
            if (!isUndefinedOrNull(_colorSet.baseColorIndex)) {
                _resetFromColors();
                _updateFromHarmony();
            } else {
                _initFromColors = true;
                _updateBaseColor();
            }

            var rule = value.harmonyRule || "ANALOGOUS";
            this.rule(rule);
            return this;
        } else {
            return _colorSet;
        }
    };

    var self = this;

    // expose this out to the world
    this.onRuleChange = function (p_event) {
        self.rule(p_event);
    }

    this.onBaseColorChange = function (p_event) {
        if (_ignoreColorChange || _rule === null) { return; }
        _updateBaseColor();
    }

    function _updateBaseColor() {
        if (_rule === null) { return; }
        var baseColor = _colorSet.swatches[_colorSet.baseColorIndex];
        var baseCylindricalColor = new CylindricalColor(colorwheel.scientificToArtisticSmooth(baseColor.hsv.h), baseColor.hsv.s / 100, baseColor.hsv.v / 100);
        _harmonyController.setBasePoint(baseCylindricalColor);

        if (_initFromColors) { _initFromColors = false; _resetFromColors(); }
        _changedColorIndex = -1;
        _updateFromHarmony();
    }

    this.rule = function (value) {
        if (value !== undefined) {

            //Set to CUSTOM if Undefined.
            if (isUndefinedOrNull(Rule[value])) { _rule = null; return; }
            //If the _rule was null (CUSTOM), we need to reset the colors first.  As color change events do not update the harmony values when in CUSTOM mode.
            if (_rule === null && _colorSet) { _resetFromColors(); }
            _rule = value;
            var restoreMode = (_mode == "restore");
            _harmonyController.setHarmonyRule(new Rule[_rule](), restoreMode);
            if (_changedColorIndex !== _colorSet.baseColorIndex) { _changedColorIndex = -1; }
            _updateFromHarmony();
        }
        else {
            return _rule ? _rule : "CUSTOM";
        }
    };

    function _resetFromColors() {
        _ignoreColorChange = true; // not sure if this is necessary
        var scheme = _harmonyController.getCurrentScheme();
        scheme.clearRegionList();
        var baseColor = _colorSet.swatches[_colorSet.baseColorIndex];

        var baseC = new CylindricalColor(colorwheel.scientificToArtisticSmooth(baseColor.hsv.h), baseColor.hsv.s / 100, baseColor.hsv.v / 100);
        var region = new RelativeColorRegion().setColorScheme2(scheme, 0, 0, 0, true);

        scheme.setBaseColor(baseC);

        for (var i = 0; i < NUMBER_SWATCHES; i++) {
            //Ignore the base color, since its already been added to the region list.
            if (_adjustedRegionIndex(i) === 0) { continue; }

            var color = _colorSet.swatches[i];
            var newC = new CylindricalColor(colorwheel.scientificToArtisticSmooth(color.hsv.h), color.hsv.s / 100, color.hsv.v / 100);
            var theta = 0;
            var rule = _colorSet.harmonyRule;
            if (rule === "ANALOGOUS") {
                var adjustedIndex = _adjustedRegionIndex(i);
                theta = adjustedIndex == 1 ? 1 :
                    adjustedIndex == 2 ? 0.5 :
                        adjustedIndex == 3 ? -0.5 : -1;
                region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, false, false);
            }
            else if (rule === "MONOCHROMATIC") {
                if (_adjustedRegionIndex(i) == 1) {
                    region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, true, false);
                }
                if (_adjustedRegionIndex(i) == 2) {
                    region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, false, true);
                }
                if (_adjustedRegionIndex(i) == 3) {
                    region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, false, false);
                }
                if (_adjustedRegionIndex(i) == 4) {
                    region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, true, false);
                }
            }
            else if (rule === "SPLIT_COMPLEMENTARY") {
                theta = adjustedIndex == 1 || adjustedIndex == 2 ? 0.5 : -0.5;
                region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, ((rule == "SHADES") ? true : false), false);

            }
            else if (rule === "TRIAD" || rule === "SQUARE" || rule === "COMPLEMENTARY" || rule === "COMPOUND" || rule === "SHADES") {
                region = new RelativeColorRegion().setColorScheme5(scheme, newC.angle() - baseC.angle(), newC.radius() - baseC.radius(), newC.height() - baseC.height(), true, theta, false, ((rule == "SHADES") ? true : false), false);
            }
        }
        _ignoreColorChange = false;
    }

    function _updateFromHarmony() {
        _ignoreColorChange = true;

        var scheme = _harmonyController.getCurrentScheme();
        var regions = scheme.regions();
        var region, color, derivedColor, swatchList = [];
        for (var i = 0; i < regions.length; i++) {
            region = regions[_adjustedRegionIndex(i)];
            color = _colorSet.swatches[i];
            if (!region || !color) { continue; }
            if (i == _changedColorIndex) { continue; }
            derivedColor = region.derivedColor();

            const colorToAllSpaces = hsvToAllSpacesDenormalized([colorwheel.artisticToScientificSmooth(derivedColor.angle()), derivedColor.radius() * 100, derivedColor.height() * 100]);

            swatchList.push({ i: i, swatch: colorToAllSpaces });
        }
        
        setSwatch(swatchList);
        _ignoreColorChange = false;
    }


    // verify this color thing 
    function _onColorChangeHandler(index) {

        if (_ignoreColorChange || _rule === null || _colorSet === null) { return; }

        //Check if index is within range of affecting harmony.
        if (index < 0 || index >= NUMBER_SWATCHES) { return; }
        _changedColorIndex = index;
        var scheme = _harmonyController.getCurrentScheme();
        var changedRegion = scheme.regions()[_adjustedRegionIndex(index)];
        if (!changedRegion) { return; }

        _ignoreColorChange = true;
        changedRegion.moveToColor(new CylindricalColor(colorwheel.scientificToArtisticSmooth(_colorSet.swatches[index].hsv.h), _colorSet.swatches[index].hsv.s / 100, _colorSet.swatches[index].hsv.v / 100));
        _updateFromHarmony();

        _ignoreColorChange = false;
    }

    // Currently removed checking for is touch Device, look at the old code for that
    this.onColorChange = _onColorChangeHandler;

    function _adjustedRegionIndex(index) {
        var baseColorIndex = _colorSet.baseColorIndex;
        if (index == baseColorIndex) { index = 0; }
        else if (index < baseColorIndex) { return index + 1; }
        return index;
    }

    // Private Properties:
    var _colorSet = null;
    var _rule = null;
    var _ignoreColorChange = false;
    var _initFromColors = false; //variable added to prevent color slider jumping
    var _changedColorIndex = -1; //more of a hack than solution to the core problem
    var _mode = "create";

    var _harmonyController = new HarmonyController();

    if (isUndefinedOrNull(theme) || theme.swatches.length < 5) { return; }

    this.colorSet(theme);
    //NOTE: We do not update based on base color here. We assume editing is CUSTOM.
}

export default HarmonyAdapter;
