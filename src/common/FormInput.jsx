import { useId } from "react";
/**
 * A basic string input.
 * @param {Object} props - The component props.
 * @param {String} [props.labelClassName=""] - The Tailwind class to apply to the label.
 * @param {string} props.className - The Tailwind class to apply to the input.
 * @param {string} props.inputText - The input label content.
 * @param {string} props.name - The field name in the JSON object.
 * @param {string} props.value - The value entered by the customer.
 * @param {(e: any) => void} props.onChange - The function to call whenever the value changes.
 * @param {boolean} [props.isStarred=false] - Whether the field is required (starred).
 * @returns {React.ReactElement} FormInput component.
 */

function FormInput({ labelClassName = "", className, inputText, name, value, onChange, isStarred = false, type = "text", id, ...rest }) {
    // Relie le libellé au champ : toucher le libellé place le curseur dans le
    // champ, et les gestionnaires de mots de passe identifient mieux le champ.
    const autoId = useId();
    const inputId = id || `${name}-${autoId}`;

    return (
        <div>
            <div>
                <label htmlFor={inputId} className={"text-rayonblue " + labelClassName}>
                    {inputText}{isStarred && <span className="text-red"> *</span>}
                </label>
            </div>
            <div>
                <input
                    id={inputId}
                    className={className}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={isStarred}
                    {...rest}
                />
            </div>
        </div>
    );
}



export default FormInput

